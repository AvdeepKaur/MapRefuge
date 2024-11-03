"use client";

import React, { useEffect, useState } from "react";

const CONFIGURATION = {
  markerIcon: "/images/blue_pin.png",
  bostonBounds: {
    north: 42.405,
    south: 42.32,
    east: -71.03,
    west: -71.13,
  },
};

export default function Map({ searchParams }) {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState("");
  const [markersLoaded, setMarkersLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (document.getElementById("google-maps-script")) return;

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      const initialMapOptions = {
        center: { lat: 42.3601, lng: -71.0589 },
        fullscreenControl: true,
        mapTypeControl: false,
        streetViewControl: true,
        zoom: 12,
        zoomControl: true,
        maxZoom: 22,
        styles: [
          {
            featureType: "all",
            elementType: "labels",
            stylers: [{ visibility: "on" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ visibility: "on" }],
          },
          { featureType: "poi.business", stylers: [{ visibility: "off" }] },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#aadaff", visibility: "on" }],
          },
          {
            featureType: "poi.museum",
            elementType: "geometry",
            stylers: [{ visibility: "on" }],
          },
          {
            featureType: "landscape.man_made",
            elementType: "geometry",
            stylers: [{ visibility: "on" }],
          },
        ],
      };

      const newMap = new google.maps.Map(
        document.getElementById("map"),
        initialMapOptions
      );
      setMap(newMap);
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    if (map) {
      if (searchParams) {
        plotAddresses();
        centerMapOnSearchParams();
      }
    }
  }, [map, searchParams]); // Trigger plotAddresses and centerMapOnSearchParams when map or searchParams changes

  const centerMapOnSearchParams = async () => {
    const { searchQuery, distance, unit } = searchParams;
    if (searchQuery) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;
          map.setCenter(location); // Center the map on the searched location

          // Calculate distance in miles and zoom level
          const distanceInMiles =
            unit === "miles"
              ? parseFloat(distance)
              : parseFloat(distance) * 0.621371; // Convert distance to miles if not already
          const zoomLevel = Math.round(15 - Math.log2(distanceInMiles));

          // Set the zoom level, ensuring it's within reasonable bounds
          map.setZoom(Math.max(0, Math.min(zoomLevel, 22))); // Ensure zoom level is between 0 and 22
        } else {
          console.error(
            "Geocode was not successful for the following reason: " + status
          );
        }
      });
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/readData");
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch error:", response.status, errorText);
        throw new Error("Failed to fetch addresses");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Fetch failed:", error);
      throw error;
    }
  };

  const plotAddresses = async () => {
    if (!map) return;

    const addressData = await fetchAddresses(); // Fetch address data
    const geocoder = new google.maps.Geocoder();
    const infowindow = new google.maps.InfoWindow();
    const newMarkers = [];

    // Here you would filter addressData based on searchParams if needed

    addressData.forEach((location) => {
      const fullAddress = `${location.Street}, ${location.City}`;
      geocoder.geocode({ address: fullAddress }, (results, status) => {
        if (status === "OK" && results[0]) {
          const position = results[0].geometry.location;

          const marker = new google.maps.Marker({
            map,
            position,
            title: location["Name of Organization"],
            icon: {
              url: CONFIGURATION.markerIcon,
              scaledSize: new google.maps.Size(30, 45),
            },
          });

          newMarkers.push(marker);

          marker.addListener("click", () => {
            infowindow.setContent(`
                <div>
                  <h2>${location["Name of Organization"]}</h2>
                  <p>${location["Summary of Services"]}</p>
                  <p><strong>Address:</strong> ${fullAddress}</p>
                  <p><strong>Website:</strong> <a href="${location.Website}" target="_blank">${location.Website}</a></p>
                </div>
              `);
            infowindow.open(map, marker);
          });
        }
      });
    });

    setMarkers(newMarkers);
    setMarkersLoaded(true);
  };

  return (
    <div
      id="map"
      style={{
        height: "750px",
        width: "1000px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    ></div>
  );
}
