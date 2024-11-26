---
title: Rewriting the cookCLI frontend
description: The old frontend is a bit dated, and it doesnt look like the project is active anymore. Time to fix that
slug: rewriting-the-cookcli-frontend
date: 2024-11-26 00:00:00+0000
image: cover.webp
categories:
 - Programming
links:
    - title: The project repo
      description: Read more about the project or install it here
      website: https://github.com/ChaoticLeah/Forkly
      image: cover.webp
# tags:
#     - Example Tag
weight: 1 # You can add weight to some posts to override the default sorting (date descending)
---

## What is CookCLI?

[CookCLI](https://github.com/cooklang/cookcli) is a command line utility for working with [cooklang](https://cooklang.org/). It provides a few subcommands such as showing recipes, shopping lists, and more. One of its big functions is the server function allowing you to host a website that contains all your recipes. I made [Forkly](https://github.com/ChaoticLeah/Forkly) a fork of CookCLI that is focused on the frontend experiance.

## Why Rewrite it?

The old frontend is fully functional, but lacked some nice extras I wanted to add. Originally I was just going to add these features ontop of what was already there, but after working on adding stuff I decided to rewrite it since it was using js (not ts), and some old web stuff like rollup, svelte 4 (I also wanted an excuse to learn svelte 5). I also wanted to make the best cooking app/site that you can self host with all the batteries included ideally including any digital tool you might need in the cooking process.

### What changed about the tech stack, and why?

Originally it was using Svelte 4, rollup, js, and bootstrap css (which tricked me into thinkinking it was tailwind at the start).

I changed it to Vite, Svelte 5, TS, and Tailwind. But why? Well I wanted to learn svelte 5, learn how to link it with a rust backend, and other things, but also it would be far easier for me to write it in stuff I knew and was up to date. Also ive learnt its far better to get your rewrites in early before you put a lot of work into it and then find you need to redo everything.

### What features did I add?

The old web UI just showed you a list of recipes, and the recipe, the steps, ingrediants, and cookware needed. It also had a shopping list. In the rewrite we also have all these features. I have also added a lot of extra useful cooking tools.

So heres what is new to this fork:
 - A built in timer.
    - When a receipe specifies a time such as "bake for 2 hours", you can click on the "2 hours", and a timer will pop up already with 2 hours filled in.
 - Built in measurement conversion
    - When a measurement is mentioned in a recipe such as "1 cup", you can click on it and convert it to any unit you want.
 - The ability to mark off ingredients on your shopping list
 - Some smaller quality of life features
    - A keep the screen on setting so your phone wont go to sleep when the recipe is up (only works on HTTPS sites since thats the limitation of the web API)
    - Some more settings to customize if you would like your conversions to be rounded off for you
    - Recipes now show extra stats to you like how many people it serves and so on
    - Its a PWA! You can download this web app on ur phone
    - It has a new modern look (maybe its a stretch to call it a feature but its my blog sooooo)

#### What I want to add:
 - The ability to sort your shopping list by category (so all the meats go together, all the fruits go together, and so on). This would be useful when shopping to save time. This is already possible using the other commands, but not in the frontend
 - A tool to scale recipes to any number of people (this will be experimental since it can scale the amounts of stuff, but not cook times and stuff. Due to this im unsure of if this will be added)
 - Maybe the possibility to add recipes from the frontend... though at this point thats only a slight maybe because that would require an account system, and its a whole lot of headache for 1 feature. For now you could pair this up with something like [File Browser](https://github.com/filebrowser/filebrowser) to be able to add recipes from the web.
 - Some sort of docker container to easily install this. This will probably only be for the web command.

##### I want to help! Can I?
Yes you can help. the repo is down below.


## So how do I use it, and should I install it?

CookCLI is already a good tool if you want just the basics, if you want all the extras then this is probably the one for you though.

### Build from source

1. Go to the [repo](https://github.com/ChaoticLeah/Forkly) and clone it

2. Go into the ui folder and run `bun install` in there. This will install all the frontends dependencies

3. In that same directory run `bun --bun run build`. This will build the frontend. Wait for that to complete

4. Go back into the main directory and run `cargo run -- --server`

5. The server should now be hosted. The console should say the adress its hosted at.

6. it comes with many starter recipes in the `seed/` dir. You can add recipes and folders in the same dir as the project. If you want to put the recipes elsewhere then in `cargo run` you will need to specify a directory.

### Download a github release

Coming soon... Hopefully. Idk I need to figure out github workflows. The forked workflows file is a few hundred lines of confusion for me.

### Docker install

Coming soon. Probably will be only for the server part though.