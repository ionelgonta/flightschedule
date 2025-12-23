#!/usr/bin/env node

/**
 * Force update weekly schedule with current persistent cache data
 * This will include Monday's data in the weekly schedule
 */

const fs = require('fs').promises;
const path = require('path');

async function forceUpdateWeeklySchedule() {
  console.log('=== FORCE UPDATE WEEKLY SCHEDULE ===');
  
  try {
    // Import the weekly schedule analyzer
    const { getWeeklyScheduleAnalyzer } = await import('../lib/weeklyScheduleAnalyzer.js');
    const analyzer = getWeeklyScheduleAnalyzer();
    
    console.log('Starting weekly schedule analysis...');
    
    // Clear existing schedule first
    await analyzer.clearScheduleTable();
    console.log('Cleared existing weekly schedule');
    
    // Update with current data (includes Monday flights)
    await analyzer.updateScheduleTable();
    console.log('Updated weekly schedule with current data');
    
    // Get the updated schedule data
    const scheduleData = await analyzer.getScheduleData();
    console.log(`Generated ${scheduleData.length} schedule entries`);
    
    // Count by day
    const daysCounts = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    };
    
    scheduleData.forEach(entry => {
      Object.keys(daysCounts).forEach(day => {
        if (entry.weeklyPattern && entry.weeklyPattern[day]) {
          daysCounts[day]++;
        }
      });
    });
    
    console.log('\n=== UPDATED WEEKLY SCHEDULE BY DAY ===');
    Object.keys(daysCounts).forEach(day => {
      console.log(`${day}: ${daysCounts[day]} flights`);
    });
    
    // Show some Monday entries
    const mondayEntries = scheduleData.filter(entry => 
      entry.weeklyPattern && entry.weeklyPattern.monday
    );
    
    console.log(`\n=== MONDAY FLIGHTS IN SCHEDULE ===`);
    console.log(`Total Monday entries: ${mondayEntries.length}`);
    
    if (mondayEntries.length > 0) {
      console.log('\nSample Monday flights:');
      mondayEntries.slice(0, 10).forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.airline} ${entry.flightNumber}: ${entry.airport} → ${entry.destination} (freq: ${entry.frequency})`);
      });
    }
    
    console.log('\n=== SUCCESS ===');
    console.log('Weekly schedule has been updated with Monday data!');
    
  } catch (error) {
    console.error('Error updating weekly schedule:', error);
  }
}

forceUpdateWeeklySchedule().catch(console.error);