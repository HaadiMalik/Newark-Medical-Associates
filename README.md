# Newark Medical Associates Web App


**Team**  
Harjot Dehal  
Haadi Malik  


## Prerequisites  
- Node.js ≥14  
- npm  


## Setup & Run  


Open **two** terminal windows:


```bash
cd frontend
npm install
npm run dev



cd backend
npm install
npm start
```


Note
We initially tried Microsoft SQL Server but ran into ongoing driver, connection-string, and environment-sync headaches, so we switched to SQLite for a zero-config, file-based database that works the same on every machine. Along the way we simplified our schema—flattening a many-to-many relationship into a single foreign key and adding indexes on high-volume columns—to keep queries fast and our data-access code straightforward. We also refined several backend routes and frontend button handlers whenever we hit unexpected 404s or auth issues, choosing simpler URL structures and a centralized API service to ensure reliability. These iterative pivots let us focus on meeting all project requirements without wrestling with setup quirks.
