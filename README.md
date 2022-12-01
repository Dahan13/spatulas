# spatulas

## Requirements :

- A working version of Docker
- A working web browser

## How to launch :

This project uses docker to launch and run without having to bother with installing NodeJS, MySQL, etc... <br>
Extract and open a terminal in this project folder, then type :

```bash
$ docker-compose build
```

After the image is built, you can launch a container using it :

```bash
$ docker-compose up -d
```

Now you can open <a href="http://localhost:8080/"> your localhost </a> and enjoy it !
