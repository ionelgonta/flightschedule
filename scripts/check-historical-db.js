#!/usr/bin/env node

/**
 * Script pentru verificarea datelor din baza de date istorică SQLite
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkHistoricalDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'historical-flights.db');
  
  console.log('=== Verificare Baza de Date Istorică ===');
  console.log(`Calea către DB: ${dbPath}`);
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('Eroare la deschiderea bazei de date:', err);
        reject(err);
        return;
      }
      
      console.log('✅ Baza de date deschisă cu succes');
      
      // Verifică structura tabelei
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='flights'", (err, row) => {
        if (err) {
          console.error('Eroare la verificarea tabelei:', err);
          db.close();
          reject(err);
          return;
        }
        
        if (!row) {
          console.log('❌ Tabela "flights" nu există');
          db.close();
          resolve();
          return;
        }
        
        console.log('✅ Tabela "flights" există');
        
        // Verifică câte înregistrări avem
        db.get("SELECT COUNT(*) as count FROM flights", (err, row) => {
          if (err) {
            console.error('Eroare la numărarea înregistrărilor:', err);
            db.close();
            reject(err);
            return;
          }
          
          console.log(`📊 Total înregistrări: ${row.count}`);
          
          // Verifică datele unice disponibile
          db.all(`
            SELECT 
              DATE(scheduledTime) as flight_date,
              COUNT(*) as count
            FROM flights 
            GROUP BY DATE(scheduledTime) 
            ORDER BY flight_date
          `, (err, rows) => {
            if (err) {
              console.error('Eroare la gruparea pe date:', err);
              db.close();
              reject(err);
              return;
            }
            
            console.log('\n📅 Date disponibile în baza de date:');
            rows.forEach(row => {
              const date = new Date(row.flight_date + 'T12:00:00');
              const dayName = date.toLocaleDateString('ro-RO', { weekday: 'long' });
              console.log(`  ${row.flight_date} (${dayName}): ${row.count} zboruri`);
            });
            
            // Verifică aeroporturile disponibile
            db.all(`
              SELECT 
                airportCode,
                COUNT(*) as count
              FROM flights 
              GROUP BY airportCode 
              ORDER BY count DESC
            `, (err, rows) => {
              if (err) {
                console.error('Eroare la gruparea pe aeroporturi:', err);
                db.close();
                reject(err);
                return;
              }
              
              console.log('\n🛫 Aeroporturi disponibile:');
              rows.forEach(row => {
                console.log(`  ${row.airportCode}: ${row.count} zboruri`);
              });
              
              // Verifică tipurile de zboruri
              db.all(`
                SELECT 
                  type,
                  COUNT(*) as count
                FROM flights 
                GROUP BY type
              `, (err, rows) => {
                if (err) {
                  console.error('Eroare la gruparea pe tipuri:', err);
                  db.close();
                  reject(err);
                  return;
                }
                
                console.log('\n✈️ Tipuri de zboruri:');
                rows.forEach(row => {
                  console.log(`  ${row.type}: ${row.count} zboruri`);
                });
                
                // Verifică un eșantion de date
                db.all(`
                  SELECT 
                    flightNumber,
                    airlineCode,
                    airportCode,
                    type,
                    scheduledTime,
                    status
                  FROM flights 
                  ORDER BY scheduledTime 
                  LIMIT 10
                `, (err, rows) => {
                  if (err) {
                    console.error('Eroare la selectarea eșantionului:', err);
                    db.close();
                    reject(err);
                    return;
                  }
                  
                  console.log('\n📋 Eșantion de date (primele 10):');
                  rows.forEach((row, index) => {
                    console.log(`  ${index + 1}. ${row.flightNumber} (${row.airlineCode}) - ${row.airportCode} ${row.type}`);
                    console.log(`     Data: ${row.scheduledTime}, Status: ${row.status}`);
                  });
                  
                  db.close();
                  console.log('\n=== Verificare completă ===');
                  resolve();
                });
              });
            });
          });
        });
      });
    });
  });
}

// Rulează verificarea
checkHistoricalDatabase().catch(console.error);