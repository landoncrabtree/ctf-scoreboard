# Scoreboard

## Description
This is a simple scoreboard web application that allows users to submit flags and view their ranking on the scoreboard. It was designed to be used as a tryout for CPTC competition, but it's functionality can be extended to any platform where flags are submitted for points.

## Features
- Account registration and login
    - SQLite database for storing user information
    - SHA-256 hashing for storing passwords
    - `express-session` for session management and user authentication
- Flag submission, validation, and scoring system
    - Submitted flags are checked against a list of valid flags
    - Points are awarded for each valid flag submitted
    - Duplicate flags are not accepted
- Scoreboard with user ranking, points, and number of flags submitted
- Countdown for when the competition ends
    - When the competition ends, the scoreboard is frozen and no more flags can be submitted

## Installation
1. Clone the repository
2. Install dependencies with `npm install`
3. Start the server with `npm start`
4. Navigate to `http://localhost:3000` in your browser

## Usage
1. Modify `scoring.js` to include your own flags and point values
2. Modify `scoring.js` to change the competition end date
3. Modify `views/*` to change the competition end date

## Pictures
![Scoreboard](https://i.imgur.com/KknNYft.png)
![Submissions](https://i.imgur.com/jLUDUDx.png)
