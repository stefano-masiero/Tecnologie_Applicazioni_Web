Nodejs + MongoDB + Express  backend
---

How to run it via Docker:

1. Create a new network

```
docker network create taw
```


2. Start a MongoDB container 

```
docker run --network taw --name mymongo -d mongo:6
```


3. Open VSC and reopen this directory in container


4. Open the terminal and run

```
npm install
npm run compile
```

5. Run the application

```
node postmessages.js
```


Optional:
---

To inspect the database with mongo shell:

```
docker run -it --name mongodbshell --network taw --rm mongo:6 mongosh --host mymongo
```

Then, inside the shell:

```
use postmessage;
show collections;
```
