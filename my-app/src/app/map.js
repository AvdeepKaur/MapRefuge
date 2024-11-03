"use client";

import React, { useEffect, useState } from "react";

const CONFIGURATION = {
  ctaTitle: "Load Locations",
  mapOptions: {
    center: { lat: 42.3601, lng: -71.0589 },
    fullscreenControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 12,
    zoomControl: true,
    maxZoom: 22,
    styles: [
      { featureType: "all", elementType: "labels", stylers: [{ visibility: "on" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ visibility: "on" }] },
      { featureType: "poi.business", stylers: [{ visibility: "off" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#aadaff", visibility: "on" }] },
      { featureType: "poi.museum", elementType: "geometry", stylers: [{ visibility: "on" }] },
      { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ visibility: "on" }] },
    ],
  },
  markerIconFullMatch: "/images/blue_pin.png",
  markerIconPartialMatch: "/images/orange_pin.png",
  bostonBounds: {
    north: 42.405,
    south: 42.320,
    east: -71.030,
    west: -71.130,
  },
};

export default function LandmarkMap() {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [circle, setCircle] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [distance, setDistance] = useState("");
  const [unit, setUnit] = useState("miles");
  const [error, setError] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

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
      const newMap = new google.maps.Map(document.getElementById("map"), CONFIGURATION.mapOptions);
      setMap(newMap);
    };

    loadGoogleMapsAPI();
  }, []);

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

  const clearMarkersAndCircle = () => {
    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);
    if (circle) {
      circle.setMap(null);
      setCircle(null);
    }
  };

  const plotAddresses = async () => {
    if (!map) return;
  
    clearMarkersAndCircle();
  
    const addressData = await fetchAddresses();
    const geocoder = new google.maps.Geocoder();
    const infowindow = new google.maps.InfoWindow();
    const newMarkers = [];
  
    addressData.forEach((location) => {
      const serviceTypes = location["Service Type"].split(",").map((service) => service.trim());
      const languages = location["Services offered in these languages"].split("-").map((lang) => lang.trim());
  
      const matchedServices = selectedServices.filter((service) => serviceTypes.includes(service));
      const matchedLanguages = selectedLanguages.filter((language) => languages.includes(language));
  
      const isFullMatch = matchedServices.length === selectedServices.length && matchedLanguages.length === selectedLanguages.length;
      const isPartialMatch = matchedServices.length > 0 || matchedLanguages.length > 0;
  
      // New logic for partial match conditions:
      const allowPartialMatch = 
        selectedServices.length > 0 || // At least one service type selected
        selectedLanguages.length > 1 || // Multiple languages selected
        (selectedLanguages.length === 1 && selectedServices.length === 0); // Only one language selected, with no service type
  
      const shouldPlotMarker = isFullMatch || (isPartialMatch && allowPartialMatch);
  
      if (shouldPlotMarker) {
        const fullAddress = `${location.Street}, ${location.City}`;
        geocoder.geocode({ address: fullAddress }, (results, status) => {
          if (status === "OK" && results[0]) {
            const position = results[0].geometry.location;
  
            const marker = new google.maps.Marker({
              map,
              position,
              title: location["Name of Organization"],
              icon: {
                url: isFullMatch ? CONFIGURATION.markerIconFullMatch : CONFIGURATION.markerIconPartialMatch,
                scaledSize: new google.maps.Size(30, 45),
              },
            });
  
            newMarkers.push(marker);
  
            const matchedTags = `
              <p><strong>Matched Services:</strong> ${matchedServices.join(", ") || "None"}</p>
              <p><strong>Matched Languages:</strong> ${matchedLanguages.join(", ") || "None"}</p>
            `;
  
            marker.addListener("click", () => {
              infowindow.setContent(`
                <div>
                  <h2>${location["Name of Organization"]}</h2>
                  <p>${location["Summary of Services"]}</p>
                  <p><strong>Address:</strong> ${fullAddress}</p>
                  ${matchedTags}
                  <p><strong>Website:</strong> <a href="${location.Website}" target="_blank">${location.Website}</a></p>
                </div>
              `);
              infowindow.open(map, marker);
            });
          }
        });
      }
    });
  
    setMarkers(newMarkers);
  };
  
  
  

  const handleCheckboxChange = (setter, item) => {
    setter((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const searchLocation = () => {
    if (!map || !searchQuery) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === "OK" && results[0]) {
        const newLocation = results[0].geometry.location;
        map.setCenter(newLocation);

        const distanceInMiles = unit === "miles" ? parseFloat(distance) : parseFloat(distance) * 0.621371;
        const zoomLevel = Math.round(15 - Math.log2(distanceInMiles));
        map.setZoom(zoomLevel);

        const newCircle = new google.maps.Circle({
          map,
          center: newLocation,
          radius: distanceInMiles * 1609.34, // Convert miles to meters
          fillColor: "#007bff",
          fillOpacity: 0.2,
          strokeColor: "#007bff",
          strokeOpacity: 0.5,
          strokeWeight: 1,
        });

        setCircle(newCircle);
      } else {
        console.error("Geocode was not successful for the following reason: " + status);
        setError("Geocode was not successful. Please enter a valid address.");
      }
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!searchQuery) {
      setError("Please enter a valid address/city/country.");
      return;
    }

    const parsedDistance = parseFloat(distance);
    if (isNaN(parsedDistance) || parsedDistance <= 0) {
      setError("Please enter a positive distance.");
      return;
    }

    setError("");
    await plotAddresses();
    searchLocation();
  };

  const showBostonMarkers = async () => {
    if (!map) return;

    if (!markers.length) {
      await plotAddresses();
    }

    const bostonBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(CONFIGURATION.bostonBounds.south, CONFIGURATION.bostonBounds.west),
      new google.maps.LatLng(CONFIGURATION.bostonBounds.north, CONFIGURATION.bostonBounds.east)
    );

    map.fitBounds(bostonBounds);
    map.setZoom(12);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        gap: "20px",
      }}
    >
      <div
        style={{
          width: "300px",
          backgroundColor: "#f0f0f0",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            paddingBottom: "15px",
          }}
        >
          <img
            src="/images/urban.png"
            alt="MapRefuge Logo"
            style={{ width: "100px", height: "auto" }}
          />
          <p
            style={{
              fontSize: "35px",
              fontFamily: "Cocomat Pro",
              fontWeight: "bold",
              textTransform: "uppercase",
              margin: "0 auto",
            }}
          >
            Map Refuge
          </p>
        </div>
        <h3>Load Locations from CSV</h3>
        <form onSubmit={handleFormSubmit}>
          {error && (
            <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
          )}
          <input
            type="text"
            placeholder="Search Address/City/Country"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          />
          <input
            type="number"
            placeholder="Distance"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          >
            <option value="miles">Miles</option>
            <option value="kilometers">Kilometers</option>
          </select>
          <div style={{ paddingBottom: "10px" }}>
            <h4>Service Types</h4>
            {[
              "Education",
              "Legal",
              "Housing/Shelter",
              "Healthcare",
              "Food",
              "Employment",
              "Cash Assistance",
              "Mental Health",
            ].map((service) => (
              <div
                key={service}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingBottom: "2px",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service)}
                  onChange={() =>
                    handleCheckboxChange(setSelectedServices, service)
                  }
                />
                <label>{service}</label>
              </div>
            ))}
            <h4>Languages</h4>
            {[
              "English",
              "Spanish",
              "French",
              "Portuguese",
              "Haitian Creole",
              "Arabic",
              "Mandarin",
              "Cantonese",
              "Somali",
              "Swahili",
              "Dari",
              "Pashto",
              "Maay Maay",
              "Darija",
            ].map((language) => (
              <div
                key={language}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingBottom: "2px",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(language)}
                  onChange={() =>
                    handleCheckboxChange(setSelectedLanguages, language)
                  }
                />
                <label>{language}</label>
              </div>
            ))}
          </div>
          <button type="submit" style={buttonStyle}>
            {CONFIGURATION.ctaTitle}
          </button>
        </form>
        <button
          onClick={showBostonMarkers}
          style={{
            ...buttonStyle,
            marginTop: "10px",
            backgroundColor: "#6c757d",
          }}
        >
          Boston View
        </button>
      </div>
      <div
        id="map"
        style={{
          height: "100vh",
          width: "90vw",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      ></div>
    </div>
  );
}

const buttonStyle = {
  width: "100%",
  padding: "10px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "16px",
  cursor: "pointer",
};

