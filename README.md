# spatulas

## Requirements :

- A working version of Docker
- A working web browser

## How to launch :

This project uses docker to launch and run without having to bother with installing NodeJS, MySQL, etc... <br>
Extract and open a terminal in this project folder, then type :

```bash
$ docker build -t <name of the image> .
```

After the image is built, you can launch a container using it :

```bash
$ docker run -dp 8080:8080 <name of the image>
```

Now you can open <a href="http://localhost:8080/"> your localhost </a> and enjoy it !
