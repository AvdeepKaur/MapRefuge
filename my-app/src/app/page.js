"use client";
import React, { useState } from "react";
import Forum from "./forumComponent.js";
import Map from "./mapComponent.js";
import LandmarkMap from "./map.js";
import AssistantChatbot from "./AssistantChatbot.js";
const CONFIGURATION = {
  bostonBounds: {
    north: 42.405,
    south: 42.32,
    east: -71.03,
    west: -71.13,
  },
};

export default function Home() {
  // const [searchParams, setSearchParams] = useState(null); // State to hold the search parameters for the Map

  // const handleSearchSubmit = (params) => {
  //   setSearchParams(params);
  // };

  // const handleBostonMarkers = () => {
  //   setSearchParams({
  //     bounds: CONFIGURATION.bostonBounds, // Setting the bounds for Boston markers
  //   });
  // };

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      {/* <Forum
        onSearchSubmit={handleSearchSubmit}
        onBostonMarkers={handleBostonMarkers}
      />
      <Map searchParams={searchParams} /> */}
      <LandmarkMap />
      <AssistantChatbot />
    </div>
  );
}
