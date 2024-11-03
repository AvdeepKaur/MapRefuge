"use client";

import React, { useState } from "react";

const CONFIGURATION = {
  ctaTitle: "Load Locations",
};

export default function Forum({ onSearchSubmit, onBostonMarkers }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [distance, setDistance] = useState("");
  const [unit, setUnit] = useState("miles");
  const [error, setError] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  const handleFormSubmit = (e) => {
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
    onSearchSubmit({
      searchQuery,
      distance,
      unit,
      selectedServices,
      selectedLanguages,
    });
  };

  const handleCheckboxChange = (setFunc, value) => {
    setFunc((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  return (
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
          style={{ width: "100px", height: "auto" }} // Adjust the size as needed
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
          <div key={service}>
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
          <div key={language}>
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
        <button type="submit" style={buttonStyle}>
          {CONFIGURATION.ctaTitle}
        </button>
      </form>
      <button
        onClick={onBostonMarkers}
        style={{
          ...buttonStyle,
          marginTop: "10px",
          backgroundColor: "#6c757d",
        }}
      >
        Boston View
      </button>
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
