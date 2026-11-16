# Fruit Quality Insights (BuahSafe)

## Overview

**Fruit Quality Insights**, also known as **BuahSafe** (Indonesian for "Fruit Safe"), is a comprehensive fruit quality assurance system consisting of both hardware scanning devices and a web-based management platform. The system uses non-destructive transmission ultrasonic technology combined with machine learning to detect internal anomalies in crystal guava (_Psidium guajava_ L.) without damaging the fruit.

**Official Title:** Sistem Skrining Non-Destruktif Berbasis Transmisi Ultrasonik dan Machine Learning untuk Deteksi Dini Anomali Internal pada Jambu Kristal Pascapanen (Non-Destructive Screening System Based on Transmission Ultrasonic and Machine Learning for Early Detection of Internal Anomalies in Post-Harvest Crystal Guava)

The platform is designed for small and medium agricultural enterprises (UMKM) to integrate quality control directly into their production workflows.

## The Problem

Crystal guava is a high-value agricultural commodity in Indonesia, but faces a critical quality control challenge:
- **Internal damage is invisible** — fruit can appear perfect on the outside while harboring internal damage from fruit fly infestations, microbial infection, or tissue breakdown
- **Current methods fail** — manual visual inspection can only assess the fruit's exterior, missing dangerous internal issues
- **Market consequences** — defective fruit discovered by consumers leads to financial loss and damage to business reputation
- **Root causes**: Fruit fly (_Bactrocera_ spp.) larvae tunnel through fruit tissue and consume internal flesh, creating hollow cavities and triggering rot before any surface symptoms appear

## The Solution

BuahSafe applies **Non-Destructive Testing (NDT)** principles to solve this problem:
- Uses **40 kHz ultrasonic transmission** through the fruit to detect structural changes
- Integrates **machine learning** to classify fruit condition with high accuracy
- Provides **instant results** (normal or anomaly detected) with confidence percentages
- Works at scale suitable for agricultural production facilities
- Maintains **traceability** through batch and operator tracking

## System Architecture

BuahSafe consists of two integrated components:

### Hardware: Scanning Chamber Device (BuahSafe Scanner)
A compact, non-destructive testing device deployed at production facilities. Operators place fruit into the chamber and receive instant quality assessment results.

### Software: Web-Based Management Platform
A centralized dashboard and analytics platform (this project) that tracks, monitors, and analyzes scanning data across all deployed devices in real-time.

---

## How It Works

### Physical Scanning Process

1. **Ultrasonic Transmission**: The scanner has two piezoelectric sensors positioned opposite each other inside a sealed chamber
   - **Transmitter**: Emits 40 kHz ultrasonic waves across the fruit chamber
   - **Receiver**: Detects the ultrasonic waves after they pass through the fruit

2. **Signal Analysis**: As ultrasonic waves travel through the fruit, their amplitude (strength) is affected by the fruit's internal structure
   - Healthy fruit with uniform tissue produces consistent signal attenuation
   - Fruit with internal cavities, rot, or damage produces different signal patterns
   - The system captures these signals and analyzes the amplitude characteristics

3. **Machine Learning Classification**: Instead of using fixed thresholds, a trained ML model analyzes the signal data to classify the fruit as:
   - **NORMAL**: Fruit passes quality check
   - **ANOMALI**: Internal damage likely detected
   - Confidence percentage indicates how certain the system is

4. **Results Display**: Operator sees instant results on the device's LCD screen with audible feedback (buzzer)

### Hardware Components

**Core Electronics:**
- **ESP32 Microcontroller**: Dual-core processor that controls the entire scanning process
- **Piezoelectric Ultrasonic Sensors (EFR-RUB40K25)**: Generate and receive 40 kHz ultrasonic waves
- **Signal Conditioning Amplifier (LM358)**: Amplifies weak receiver signals for accurate digital conversion
- **ADC (Analog-to-Digital Converter)**: Converts analog sensor signals to digital data

**User Interface:**
- **LCD Display**: Shows status and results
- **Push Button**: Operator triggers scan
- **Buzzer**: Audio feedback for results

**Mechanical Design:**
- **Scan Chamber**: Compact, closed box with acoustic dampening
- **Foam Holder**: Positions fruit consistently in the scanning path
- **Acoustic Lining**: Absorbs unwanted signal reflections from chamber walls

### Web Application Role

The web application provides the management layer:
- **Device Command & Control**: Send scan triggers to connected devices
- **Real-time Data Collection**: Receive scan results from hardware devices  
- **Historical Tracking**: Store and retrieve all scan records with timestamps
- **Quality Analytics**: Analyze anomaly rates, device performance, and batch statistics
- **Operator Management**: Track which operator performed each scan
- **Batch Organization**: Group scans into production batches for analysis
- **Alerts & Monitoring**: Monitor device health and notify on issues

---

## Purpose

This application enables fruit processing facilities to:
- Deploy and manage multiple ultrasonic scanning devices across production floors and warehouses
- Perform real-time quality checks on fruit batches with full traceability
- Track scan results with anomaly detection and confidence levels
- Monitor device status and firmware versions
- Analyze trends and identify quality patterns over time
- Manage operator workflows and access control through role-based permissions

## Key Features

### 1. **Dashboard**
   - Real-time overview of scanning operations
   - Key metrics: total scans, anomalies detected, devices online
   - Historical trends and visualizations
   - Status indicators and performance metrics

### 2. **Scan Management**
   - Trigger ultrasonic scans on connected devices
   - Real-time scan results display
   - Batch tracking for organized data collection
   - Operator-specific scan history
   - Confidence level reporting for each scan

### 3. **Device Management**
   - Monitor multiple scanning stations ("Meja Sortasi" - sorting tables)
   - Track device status: online, idle, offline
   - View firmware versions and installation dates
   - Scan count and last seen timestamp per device
   - Location-based organization (production floor, warehouse, etc.)

### 4. **Analytics & History**
   - Historical scan data with filtering
   - Batch-level analytics
   - Trend analysis over time
   - Anomaly rate tracking
   - Device performance metrics

### 5. **User Management & Authentication**
   - Role-based access control (operators, administrators)
   - Per-operator scan attribution
   - Notes and observations tracking
   - User-specific dashboards

### 6. **Notifications**
   - Real-time notifications for scan events
   - Device status alerts
   - Anomaly notifications

## Technical Stack

### Hardware Stack
- **Microcontroller**: ESP32 (dual-core WiFi/Bluetooth capable)
- **Ultrasonic Transducers**: Piezoelectric sensors (EFR-RUB40K25) @ 40 kHz
- **Signal Processing**: Analog-to-Digital Converter (12-bit ADC)
- **Amplification**: Op-Amp based signal conditioning (LM358)
- **Communication**: WiFi/Bluetooth to web platform
- **User Interface**: LCD display, push button, buzzer

### Software Stack (Web Application)
- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack React Router v1
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI (accessible component library)
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation
- **Charts & Visualization**: Recharts for data trends
- **Animations**: Framer Motion for smooth UX
- **Deployment**: Vercel
- **Icons**: Lucide React

### Machine Learning Component
- Signal feature extraction from raw ultrasonic data
- Classification model trained on healthy vs. anomalous fruit samples
- Confidence scoring (0-100%) for each classification decision

## Project Structure

```
src/
├── routes/              # Page components and route handlers
│   ├── index.tsx       # Dashboard page
│   ├── scan.tsx        # Scanning interface
│   ├── devices.tsx     # Device management
│   ├── analytics.tsx   # Analytics & trends
│   ├── history.tsx     # Scan history
│   ├── master-data.tsx # Data management
│   ├── login.tsx       # Authentication
│   └── __root.tsx      # Layout wrapper
├── components/
│   ├── buahsafe/       # Application-specific components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatusBadge.tsx
│   │   └── NotificationPanel.tsx
│   └── ui/             # Reusable UI components (buttons, cards, dialogs, etc.)
├── lib/
│   ├── buahsafe-data.ts    # Data models and seed data
│   ├── auth.tsx            # Authentication logic
│   ├── error-capture.ts    # Error handling
│   ├── error-page.ts       # Error pages
│   └── utils.ts            # Utility functions
├── hooks/
│   └── use-mobile.tsx      # Mobile detection hook
└── main.tsx            # Application entry point
```

## Data Models

### Device
```typescript
- id: string           // Device identifier (e.g., "BSF-001")
- name: string         // Display name (e.g., "Meja Sortasi A")
- location: string     // Physical location
- status: online|offline|idle
- lastSeen: ISO timestamp
- totalScans: number
- firmwareVersion: string
- installDate: ISO timestamp
```

### ScanRecord
```typescript
- id: string           // Unique scan identifier
- deviceId: string     // Which device performed the scan
- deviceName: string
- timestamp: ISO timestamp
- result: NORMAL|ANOMALI
- confidence: number   // 0-100 confidence level
- amplitudeAvg: number // Ultrasonic amplitude average
- batchId: string      // Batch identifier for grouping
- operatorNote?: string
- operatorId?: string  // Who triggered the scan
```

## Workflow

1. **Operator Login**: User authenticates to the system
2. **Select Device**: Choose an available (online/idle) scanning station
3. **Trigger Scan**: Initiate an ultrasonic scan on the selected device
4. **Receive Results**: Get immediate feedback (NORMAL/ANOMALI with confidence %)
5. **Track History**: View personal and facility-wide scan history
6. **Analyze Data**: Use dashboard and analytics for trend analysis and quality insights

## Key Use Cases

- **Quality Control**: Identify defective fruit before packaging with scientific accuracy
- **Batch Management**: Track quality metrics per production batch with complete traceability
- **Device Monitoring**: Ensure scanning stations remain operational and firmware current
- **Trend Analysis**: Identify patterns in anomaly rates over time and seasonal variations
- **Operator Accountability**: Track which operator performed each scan for quality assurance
- **Facility Management**: Oversee multiple scanning locations across production/warehouse
- **Market Compliance**: Document quality checks for food safety and export requirements
- **Loss Reduction**: Prevent defective fruit from reaching consumers and damaging market reputation

## Target Users

- **Primary**: Crystal guava producers and exporters (UMKM scale operations)
- **Secondary**: Quality control managers and supervisors
- **Tertiary**: Production facility operators and technicians
- **End Beneficiary**: Consumers who receive consistently high-quality fruit

## Key Benefits

**For Business:**
- Reduces economic losses from product rejection and returns
- Increases production efficiency through faster, objective quality checks
- Builds market trust through documented quality assurance
- Enables consistent batch quality for premium market segments

**For Operations:**
- Objective, non-subjective fruit assessment (eliminates human bias)
- Fast assessment (< 2 seconds per fruit)
- Non-destructive (fruit remains marketable even if flagged)
- Scalable (can deploy multiple stations across facilities)

**For Science:**
- Proof of concept for ultrasonic NDT on agricultural produce
- Real-world validation of machine learning for agricultural quality control
- Cost-effective solution suitable for developing regions

## Deployment

The web application is built for deployment on **Vercel** (cloud platform for modern web apps) and includes:
- Vite optimization for fast builds and development
- Static asset handling via Vercel configuration
- 404 error page handling for single-page application routing
- Integration with hardware devices via WiFi/API

## Project Status

**Current Phase:** Proof of Concept (PoC)
- **Web Platform**: Functional MVP with demo data and simulation
- **Hardware**: Conceptual design documented; prototyping phase
- **ML Pipeline**: Framework defined; training data collection in progress
- **Testing**: Using seed data for development and validation

**Next Steps:**
- Hardware prototype development and testing
- ML model training on real fruit samples
- API integration between hardware devices and web platform
- Field testing at partner UMKM facilities
- Production deployment strategy
