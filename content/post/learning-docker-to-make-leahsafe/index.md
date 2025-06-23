---
title: Learning docker to make Leahsafe (A personal drive)
description: Dockers kinda confusing so I wrote down some notes
slug: learning-docker-to-make-leahsafe
date: 2024-11-11 17:00:00+0000
image: cover.png
categories:
 - Programming
links:
    - title: The project repo
      description: Read more about the project or install it here
      website: https://github.com/ChaoticLeah/leahsafe
      image: cover.png
# tags:
#     - Example Tag
# weight: 1       # You can add weight to some posts to override the default sorting (date descending)
---

{{% callout title="What this article is" %}}
This is a hybrid of me telling a story and some notes for when I use docker again. I may get some stuff wrong. If you know docker pretty well you probably know all the docker bits very well. Feel free to correct me if I get stuff wrong.
{{% /callout %}}

## Introduction

Recently I decided to host my own personal [drive](https://drive.leahdevs.xyz/) since often I have to send small files to friends, or myself. Sometimes it's early builds of my games, and sometimes images. Looking around I found chibisafe. It looked nice and worked as a general drive which was exactly what I needed, and as a bonus, it looked nice, had a PWA, and was somewhat customizable. Well after much struggle from figuring out how to set it up with nginx, I realized I wanted to style it more. The problem is it was in a docker container, and from what I remembered at the time it's very hard to edit stuff in docker containers. I would have to fork the software and learn docker a bit more than just knowing to run `docker compose up`. For anyone interested they can also self-host a drive using my software [here](https://github.com/ChaoticLeah/leahsafe) Also a lot of this article was learned from [this article](https://medium.com/@komalminhas.96/a-step-by-step-guide-to-build-and-push-your-own-docker-images-to-dockerhub-709963d4a8bc). A lot of this is just quick notes for me to look back at later, but I hope it helps someone.

{{% callout title="Warning about hosting this software" type="warning" %}}
This was a personal project to change some things and to learn, it may not always be the most up to date. It may also be a little bit broken (though ill try to keep the docker releases bug free)

Right now the only known bug is that dark theme is a little broken on the home page
{{% /callout %}}

## Learning to publish a docker container

For more details please refer to [this article](https://medium.com/@komalminhas.96/a-step-by-step-guide-to-build-and-push-your-own-docker-images-to-dockerhub-709963d4a8bc). Ill just be going over the main points.

### Building

So first I needed to build the docker container based on a dockerfile. For the server, I ran
`docker build -t leahsafe-server . -f .\docker\DockerfileServer`. This tells it to build a docker container with the name leahsafe-server, and it also provides the location of the dockerfile to use. This isn't needed if you have a single top-level dockerfile named `Dockerfile` but in this case, there are 2 Dockerfiles (1 for the server, and one for the frontend). 

To check this has worked `docker images` can be run and we should see `leahsafe-server`. It can even be run now, but it's not public yet.

### Tagging

Next, we need to tag the image. For this we will use `docker tag`, and according to the article here is how it's used: `docker tag <name of the image> <dockerhub username> <name of your repo> <version>`. So I wanted to do a new release so I tagged this image so that docker knows it is the latest build by running `docker tag leahsafe-server:latest chaoticleah/leahsafe-server:latest`

### Pushing

Finally, we need to push the image after it has been made. Following this format `docker push <image name> <version name>`, running `docker push chaoticleah/leahsafe-server:latest` will push this image. You will also have to log into your dockerhub account once before running this. `docker login` should do the trick (Just read what it says and follow along to log in)

### Publishing the frontend

For some reason the frontend is in a separate docker container, I don't quite understand why but I wasn't going to change that all around for no reason so to build the frontend I did everything above again just remove the `-server` from most commands.

## Pulling the container

Running pre-made containers can be run through a super long docker command, but this is not encouraged unless you are just testing something out. In most cases, you will want to make a `docker-compose.yml`. To me these somewhat make sense but I'd still have to reference a lot to make one on my own, thankfully I mostly just pulled chibisafes docker-compose and changed some stuff and it worked.

## So what did I end up adding to leahsafe?

Not a huge amount. I restyled the home page and added a contact page that can be changed in the settings. Most of the stuff is style changes, and it was more of a fun learning experience, but who knows I might add some more stuff later. Feel free to host a leahsafe instance, I'd love to hear if you do, but I can't guarantee I'll keep it super up to date with upstream. The instructions to run it have been put in the repo's readme. Check it out [here](https://github.com/ChaoticLeah/leahsafe). If you would rather host a [chibisafe](https://github.com/chibisafe/chibisafe) instance then here you go.


So in the end I still have a lot more to learn about docker. Of course, practice will help a lot, but I think this really helped me understand how it works more.

## Other useful stuff
- .dockerignore - Tells docker not to include these files in the build