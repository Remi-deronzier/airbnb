# Airbnb API

Airbnb API is a miniature-scale reproduction of the Airbnb API that allows users to : create an account, login to this account, create a rental, update this rental (including uploading pictures), filter the rentals and delete a rental.

Frontend project is here: 👉 [Frontend](https://github.com/Remi-deronzier/airbnb-app)

## Prerequisties

Before you begin, ensure you have met the following requirements:
* You have installed the latest version of `node.js`, `MongoDB` and you have a [Cloudinary](https://cloudinary.com/) account
* You have a `Windowd/Linux/Mac` machine.

*Option : you can install [Postman](https://www.postman.com/) to easily make requests.*

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

## Route documentation (main routes)

### /user/signup (POST)
Add a new user in DB

Body | Type | Required
------------ | ------------- | ------------
`email` | string | Yes
`password` | string | Yes
`username` | string | Yes
`description` | string | Yes

### /user/login (POST)
Log a user

Body | Type | Required
------------ | ------------- | ------------
`email` | string | Yes
`password` | string | Yes

### /user/:id (GET)
Get all information about one user

Param | Required | Description
------------ | ------------- | ------------
`id` | Yes | user id

### /user/update (PUT)
Update information about one user (except picture & password)

Body | Type | Required
------------ | ------------- | ------------
`email` | string | No
`username` | string | No
`description` | string | No

At least one field must be updated

### /user/upload-picture/:id (PUT)
Upload a picture for a user

Param | Required | Description
------------ | ------------- | ------------
`id` | Yes | user id

Body | Type | Required
------------ | ------------- | ------------
`picture` | file | Yes



### /rentals (GET)
Get all the rentals

### /rental/:id (GET)
Get one specific rental

Param | Required | Description
------------ | ------------- | ------------
`id` | Yes | rental id

### /rentals/around (GET)
Get all rentals around the position of the user

Param | Required | Description
------------ | ------------- | ------------
`longitude` | Yes | longitude of the position of the user
`latitude` | Yes | latitude of the position of the user
