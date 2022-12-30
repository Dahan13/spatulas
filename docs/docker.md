# Useful commands for docker :

- Build the image
```bash
$ docker build -t <name of the image>
``` 
<br>

- Run a container using the image
```bash
$ docker run -dp 8080:8080 <name of the image>
```
<br>

- Get the ID of the container
```bash
$ docker ps
```
<br>

- Get the logs from the container
```bash
$ docker container logs <container id>
```
<br>

- Stop the container
```bash
$ docker stop <container id>
```
<br>

- Delete the container
```bash
$ docker rm <container id>
```
<br>

- Save an image as an archive
```bash
$ docker save --output Path\To\Folder\app.tar docker.io/result/latest
```