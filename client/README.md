# VOX – Social Blogging Platform

VOX is a full-stack social blogging web application that allows users to share posts, interact with others, and explore nearby content using location-based services.

---

## 📌 Project Overview

This project is developed as a mini project for academic purposes.  
It demonstrates the use of modern web technologies including React, Redux Toolkit, Node.js, Express, MongoDB, and automated testing using Vitest.

The system supports social interactions such as posting, liking, commenting, following users, searching profiles, and viewing nearby posts based on user location.

---

## 🛠 Technologies Used

### Frontend
- React.js
- Redux Toolkit
- React Router
- Custom CSS (Dark Theme UI)
- React Testing Library
- Vitest

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Multer (file uploads)

---

## ✨ Features

- User Registration & Login
- Create, Edit, and Delete Posts
- Like & Unlike Posts
- Comment on Posts
- Follow & Unfollow Users
- User Profiles
- Search Users
- Location-Based Posts (Nearby Posts)
- Dark Theme UI
- Disable Like Button for Guests
- Client-side Validation
- Unit Testing with Vitest

---

## 📍 Location-Based Service

The application allows users to:
- Automatically detect their current location
- Attach full location details to posts
- View posts within a specific radius using GeoJSON and MongoDB 2dsphere index

---

## 🧪 Testing

The project includes **4 automated test cases** using Vitest and React Testing Library:

1. Basic Vitest setup test
2. Disable like button when user is not logged in
3. Render post content when user is logged in
4. Prevent submitting empty post (no text and no image)

All tests pass successfully.

---

## ▶️ How to Run the Project

### Client
```bash
cd client
npm install
npm start

cd server
npm install
node index.js


cd client
npm test


👩‍💻 Author

Safa Alshukaili
Software Engineering Student
University of Technology and Applied Sciences – UTAS
