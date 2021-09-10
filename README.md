# Airbnb API

Airbnb API is a miniature-scale reproduction of the Airbnb API that allows users to : create an account, login to this account, create a rental, update this rental (including uploading pictures), filter the rentals and delete a rental.

## Prerequisties

Before you begin, ensure you have met the following requirements:
* You have installed the latest version of `node.js`, `MongoDB` and you have a [Cloudinary](https://cloudinary.com/) account
* You have a `Windowd/Linux/Mac` machine.

*Option : you can install `Postman` to easily make requests.*

## Installing Airbnb API

Clone this repository:
```
git clone https://github.com/Remi-deronzier/airbnb-api.git
cd airbnb-api
```

Install packages:
```
npm i
```

Create a `.env` file at the root of the project and store the following environment variables:
```
CLOUDINARY_NAME = <your-cloudinary-name>
CLOUDINARY_API_KEY = <your-cloudinary-api-key>
CLOUDINARY_API_SECRET = <your-cloudinary-api-secret>
MONGODB_URI = <your-mongodb-uri>
PORT = <the-listening-port-of-your-server>
```

When installation is complete, run the project:
```
npx nodemon index.js
```


