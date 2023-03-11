# spatulas

## Requirements :

- A working version of Docker

## How to launch :

<a href="https://github.com/Dahan13/spatulas/releases"> Download the release you want. </a> Move the Spatulas.zip archive to where you want it and dezip it. 

Then, in that same folder, type in the terminal :

```bash
$ docker-compose up -d
```

Your website is now running. You can access it at <a href="http://localhost:80/"> localhost:80 </a> or the website on any devices if online.

## How to use :

Documentation for users is available at <a href="https://github.com/Dahan13/spatulas/tree/main/docs/user%20documentation"> this link </a>.

Documentation for developers is available at <a href="https://github.com/Dahan13/spatulas/tree/main/docs/dev%20documentation"> this link </a>.

## Important to know :

- The first thing you should do is change the master password set by default at **abcd**. You can do it in the settings page : <br>
Head to the settings page by going on <a href="http://localhost:80/spadmin"> localhost/spadmin </a> or, if the website is hosted online, on **"Your URL"/spadmin**, enter the default password, click on the gear icon and change the password. <br>

- Don't forget to clear the user database each time you wish to create a new event ! You can do it in the settings page.

- If you update the website, you will need to update the database. To do so, you need to clear the database, there is a button for that in the settings page. For now there is now way to keep data when updating the website.


