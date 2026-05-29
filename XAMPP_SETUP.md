# XAMPP Integration Setup Guide

This guide explains how to connect your React frontend to a XAMPP MySQL database via a Node.js/Express backend API.

## Architecture Overview

```
React Frontend (Port 3000)
    ↓ (API calls via fetch)
Node.js/Express Backend (Port 5000)
    ↓ (SQL queries)
MySQL Database (XAMPP)
```

---

## Step 1: Install XAMPP

1. Download XAMPP from: https://www.apachefriends.org/
2. Install with default settings
3. Start Apache & MySQL from XAMPP Control Panel

---

## Step 2: Create MySQL Database

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Create new database named: `smart_plant_watering`

3. Run this SQL to create the tables:

```sql
CREATE TABLE plants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  moisture_level INT DEFAULT 50,
  status VARCHAR(50),
  last_watered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE watering_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  plant_id INT NOT NULL,
  watering_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moisture_before INT,
  moisture_after INT,
  FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO plants (name, location, moisture_level, status, last_watered) VALUES
('Monstera', 'Living Room', 75, 'Healthy', NOW()),
('Snake Plant', 'Bedroom', 40, 'Needs Attention', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('Pothos', 'Kitchen', 100, 'Needs Attention', NOW()),
('Fiddle Leaf Fig', 'Office', 55, 'Healthy', DATE_SUB(NOW(), INTERVAL 3 DAY));
```

---

## Access from Other Devices

If the React frontend or another client runs on a different computer or mobile device, use the backend machine's local network IP instead of `localhost`. For example:

```bash
http://192.168.1.10:5000/api/plants
```

Also ensure the frontend origin is permitted by your CORS settings and that all devices are on the same LAN.

---

## Step 3: Create Node.js Backend API

Create a `backend` folder in your project root:

```bash
mkdir backend
cd backend
npm init -y
npm install express mysql2 cors dotenv
```

Create `backend/server.js`:

```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Default XAMPP password is empty
  database: 'smart_plant_watering',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// GET all plants
app.get('/api/plants', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [plants] = await connection.query('SELECT * FROM plants');
    connection.release();
    res.json(plants);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

// GET single plant by ID
app.get('/api/plants/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [plant] = await connection.query(
      'SELECT * FROM plants WHERE id = ?',
      [req.params.id]
    );
    connection.release();
    
    if (plant.length === 0) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    res.json(plant[0]);
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({ error: 'Failed to fetch plant' });
  }
});

// POST new plant
app.post('/api/plants', async (req, res) => {
  const { name, location, moisture_level, status } = req.body;
  
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO plants (name, location, moisture_level, status) VALUES (?, ?, ?, ?)',
      [name, location, moisture_level || 50, status || 'Healthy']
    );
    connection.release();
    
    res.status(201).json({
      id: result.insertId,
      name,
      location,
      moisture_level,
      status
    });
  } catch (error) {
    console.error('Error creating plant:', error);
    res.status(500).json({ error: 'Failed to create plant' });
  }
});

// PUT update plant (water the plant)
app.put('/api/plants/:id', async (req, res) => {
  const { moisture_level, status } = req.body;
  
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE plants SET moisture_level = ?, status = ?, last_watered = NOW() WHERE id = ?',
      [moisture_level || 100, status || 'Healthy', req.params.id]
    );
    connection.release();
    
    res.json({ message: 'Plant updated successfully' });
  } catch (error) {
    console.error('Error updating plant:', error);
    res.status(500).json({ error: 'Failed to update plant' });
  }
});

// DELETE plant
app.delete('/api/plants/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM plants WHERE id = ?', [req.params.id]);
    connection.release();
    
    res.json({ message: 'Plant deleted successfully' });
  } catch (error) {
    console.error('Error deleting plant:', error);
    res.status(500).json({ error: 'Failed to delete plant' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

Create `backend/.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_plant_watering
PORT=5000
```

---

## Step 4: Run the Backend Server

```bash
cd backend
npm start
```

You should see: `Server running on http://localhost:5000`

Test the API:
- Open browser: `http://localhost:5000/api/plants`
- You should see your plants data in JSON format

---

## Step 5: Update React Frontend to Fetch Real Data

In your Dashboard component, replace the mock data fetch with:

```javascript
useEffect(() => {
  const fetchPlants = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/plants');
      if (!response.ok) {
        throw new Error('Failed to fetch plants');
      }
      const data = await response.json();
      setPlants(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch plants data');
      setLoading(false);
      console.error('Error fetching plants:', err);
    }
  };

  fetchPlants();
}, []);
```

---

## Moisture Level Color Rules

```
moisture_level = 100%     → GREEN (#10b981)
moisture_level 50-80%     → BLUE (#3b82f6)
moisture_level below 50%  → ORANGE (#f59e0b)
moisture_level = 0%       → RED (#ef4444)
```

---

## API Endpoints Available

### Plant Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plants` | Get all plants |
| GET | `/api/plants/:id` | Get single plant |
| POST | `/api/plants` | Create new plant |
| PUT | `/api/plants/:id` | Update plant (water it) |
| DELETE | `/api/plants/:id` | Delete plant |

### Watering History Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plants/:id/water` | Log watering event for a plant |
| GET | `/api/plants/:id/history` | Get watering history for specific plant |
| GET | `/api/watering-history` | Get all watering history (for analytics) |

---

## Testing with Postman (Optional)

1. Download Postman: https://www.postman.com/downloads/
2. Create requests to test each endpoint
3. Example POST request:
```json
{
  "name": "Spider Plant",
  "location": "Window",
  "moisture_level": 65,
  "status": "Healthy"
}
```

---

## Troubleshooting

**"XAMPP not responding"**
- Ensure Apache & MySQL are started in XAMPP Control Panel
- Check that ports 80 (Apache) and 3306 (MySQL) are available

**"Cannot connect to database"**
- Verify database name is `smart_plant_watering`
- Check MySQL is running in XAMPP
- Verify credentials in `.env` file

**"CORS errors"**
- Backend must have cors enabled
- Ensure backend is running on port 5000
- Frontend should be on port 3000

---

## Next Steps

1. ✅ Set up XAMPP and MySQL database
2. ✅ Create Node.js/Express backend
3. ✅ Update React to fetch real data
4. ✅ Test all API endpoints
5. Implement add/edit/delete plant features
6. Add user authentication
7. Deploy to production

---

**Need help?** Run these commands to start developing:

```bash
# Terminal 1: Start React Frontend
npm start

# Terminal 2: Start Node.js Backend (from backend folder)
npm start
```

Open `http://localhost:3000` in your browser!
