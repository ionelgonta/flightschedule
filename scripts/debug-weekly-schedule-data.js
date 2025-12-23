#!/usr/bin/env node

/**
 * Debug script to check current weekly schedule data format
 */

const fs = require('fs');
const path = require('path');

async function debugWeeklyScheduleData() {
  try {
    console.log('=== Weekly Schedule Data Debug ===');
    
    // Check if we can access the API
    const response = await fetch('http://localhost:3000/api/admin/weekly-schedule?action=get');
    const data = await response.json();
    
    if (data.success) {
      console.log(`Found ${data.data.length} schedule entries`);
      
      // Show first 5 entries to see the format
      console.log('\n=== Sample Data (first 5 entries) ===');
      data.data.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.airport} → ${item.destination}`);
        console.log(`   Airline: ${item.airline}`);
        console.log(`   Flight: ${item.flightNumber}`);
        console.log(`   Frequency: ${item.frequency}`);
        console.log('');
      });
      
      // Check for IATA codes vs city names
      console.log('\n=== Airport Code Analysis ===');
      const airports = [...new Set(data.data.map(item => item.airport))];
      const destinations = [...new Set(data.data.map(item => item.destination))];
      
      console.log('Departure airports:');
      airports.slice(0, 10).forEach(airport => {
        const isIATA = airport.length === 3 && airport === airport.toUpperCase();
        console.log(`  ${airport} ${isIATA ? '(IATA)' : '(City Name)'}`);
      });
      
      console.log('\nDestination airports:');
      destinations.slice(0, 10).forEach(dest => {
        const isIATA = dest.length === 3 && dest === dest.toUpperCase();
        console.log(`  ${dest} ${isIATA ? '(IATA)' : '(City Name)'}`);
      });
      
    } else {
      console.error('Failed to get schedule data:', data.error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugWeeklyScheduleData();