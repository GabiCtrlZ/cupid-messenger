# Ok Cupid automated messenger

This project sends pre-defined messages to all of the liked users.

## Installation

To clone the repository, run the following command:
```bash
git clone https://github.com/GabiCtrlZ/cupid-messenger.git
```

This project is written in [Node.js](https://nodejs.org/en/) So refer to the [Node.js documentation](https://nodejs.org/en/docs/) for more information.

To install the dependencies, run the following command:
```bash
npm install
```
 
*NOTE* This project uses puppeteer to automate the browser. Refer to the [puppeteer documentation](https://github.com/puppeteer/puppeteer) in case you have any questions or issues.

## Configuration

You'll need to get your cookies from [Ok Cupid](https://www.okcupid.com/) and put them in the `.env` file.
To find your cookies, go to your profile page and copy the cookies from the `document.cookie` variable or use the developer tools to find the cookies.
The cookies needed are:
```bash
AUTH_LINK= # The auth link cookie
SIFT_SESSION= # The sift session cookie
SESSION= # The session cookie
SSID= # The ssid cookie
UA= # The user agent cookie
```

## Running the bot

To run the bot, run the following command:
```bash
npm start
```