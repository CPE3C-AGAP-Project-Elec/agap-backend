# AGAP: AUTOMATED GEOSPATIAL ALERT PLATFORM

<img width="1280" height="1280" alt="agap - logo (6)" src="https://github.com/user-attachments/assets/40ce1dcc-b8ff-4c33-bd95-0f36bee9d6e5" />

**AGAP (Automated Geospatial Alert Platform)** is a web-based system that provides interactive map visualizations, flood level monitoring, forecast data insights, and real-time alerts to support early awareness and informed decision-making.  

Through predictive analysis based on rainfall and environmental data, AGAP delivers accessible, accurate, and reliable information to its users.

---

## What is AGAP?

AGAP stands for **Automated Geospatial Alert Platform**.  

It is a web-based flood risk monitoring system designed to help communities stay informed and prepared for potential flooding events. By integrating real-time weather data, location-based mapping, and risk analysis, AGAP enables users to quickly and accurately assess flood risks within their barangay.

---

## Table of Contents

- [What the Platform Monitors](#what-the-platform-monitors)  
- [Overview](#overview)  
- [Features](#features)  
- [User Manual](#user-manual)  
- [Tech Stack](#tech-stack)  
- [External API](#external-api)  
- [Developers](#developers)  
- [Data Sources](#data-sources)  
- [Acknowledgment](#acknowledgment)

---

## What the Platform Monitors

- **Flood Level** – shows the possible flood level in a specific location  
- **Weather Forecast** – shows the expected weather in the coming days  
- **Flood Forecast** – shows the predicted flood levels in the coming days  

---

## Overview

The platform monitors the following:

- **Flood Level** – shows the possible flood level in a specific location  
- **Weather Forecast** – shows the expected weather in the coming days  
- **Flood Forecast** – shows the predicted flood levels in the coming days  

---

## Features

### Flood Level Monitoring
- Level of flood in searched location  
- Real-time monitoring  
- Level: Low, Medium, High chance of flooding  

### Weather Forecast
- Weather prediction  
- Real-time weather forecast  
- Weather: Sunny, Cloudy, Rainy  

### Flood Forecast
- Graphical representation  
- Real-time flood forecast  
- Level and date  

### Design & UX
- Floating hero image animation  
- Fully responsive — mobile, tablet, and desktop optimized  
- Smooth animations — page transitions and micro-interactions  
- Minimalist design  
- Easy to use  

### User Account
- Google sign-in  
- Password management (forgot password)  
- Email/password registration  
- Log out  

---

## User Manual

### Landing Page
- Animated landing page  
- Click **“Explore Map”** or **“Log in / Sign Up”** to access the website  

### Create an Account
- Click **Sign Up**  
- Use email and password (must include a special character)  
- Option to connect to an existing account  

### Log In
- Enter email and password  
- Click **Log In**  

### Forgot Password
- Click **“Forgot Password”**  
- Receive authentication  
- Reset password  

### Welcome Page
- Redirected after login or signup  
- Search for a location  
- Click search to go to the result page  

### Result Page
- Displays flood level, weather forecast, and flood forecast  
- Map visualization with marked location  
- Zoom in and zoom out functionality  

### About Us Page
- Website description  
- Shows team members  

### Profile Page
- Displays account information  
- Log out button  

### Navigation Bar
- Logo, website name, Home, About Us, Explore Map, Contact, Profile  

### Footer / Contact
- Displays email, contact number, and copyright  

---

## Tech Stack

### Frontend
- React (Vite) + JavaScript  
- Tailwind CSS (Styling)  
- React Router (Navigation)  
- Axios (API Requests)  
- Chart.js / react-chartjs-2 (Data Visualization)  
- Google Maps API (Maps & Location)  
- Lucide React (Icons)

### Backend
- Node.js + Express  
- MongoDB Atlas (Database)  
- JWT Authentication  
- bcrypt (Password Hashing)  
- Nodemailer (Email Verification / Reset Password)  
- Google OAuth 2.0 (Optional Login)

---

## External API

| API | Purpose |
|-----|--------|
| Google Maps API | Map visualization and interaction |
| Geolocation API | Real-time user location detection |

---

## Developers

| Name | Role |
|------|------|
| Balala, Fiona Rose A. | Developer |
| Balbin, Alleah Joy M. | Developer |
| Nicolas, Abigail B. | Developer |
| Santos, Leanna Rose S. | Developer |
| Villafranca, Ryza Gwen P. | Developer |

---

## Data Sources

- Geolocation API – provides real-time user location data  
- Google Maps – provides map and geographic visualization  

---

## Acknowledgment

AGAP is a flood risk monitoring system that delivers real-time environmental insights to help users stay informed and prepared.

This project was developed as part of the Computer Engineering program at **Bulacan State University**.

**AGAP: Real-Time Flood Risk Monitoring System**  
© 2025–2026
