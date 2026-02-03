---
title: Releasing a KISS view counter
description: Some info about simple view counter that you can also use. Also KISS stands for Keep it stupid simple.
slug: simple-view-counter
date: 2024-11-15 00:00:00+0000
image: image.png
categories:
    - Programming
links:
    - title: Simple View Counter Repo
      description: View the code or install it here
      website: https://github.com/ChaoticLeah/simple-view-counter
comment_post:
  host: infosec.exchange
  id: 116008888349428882
# weight: 1       # You can add weight to some posts to override the default sorting (date descending)
---

## What is it?

Simple view counter is a small project I made to learn Rust, Docker, and Nginx some more. I have published it so anyone can use it for their blogs, websites, or whatever. It's fully compatible and made with static sites like this blog in mind. It's meant to be a really lightweight, simple view counter.

### A bit more detail

It is meant to count views not just on 1 page but across different sub-pages. Like this blog, I have various blog posts so I want separate counters for each post. It will count 1 view per person that sees the blog per 12 hours (configurable. Also on restart of the process the cooldown resets, but this should only be done to edit the config or update it)

## Can I use it?

{{% callout title="Something to note" type="warning" %}}
Make sure you configure your CORS to try to prevent people who might spam the API which will artificially increase the view number. The chance of this is probably very slim but I thought it was noteworthy. Even if they do try to spam it at worst they can add a view for each page per 12 hours (on the default config)

Also, make sure to set your allowed_keys so that if people try to send random requests it won't work on anything but the allowed ones.

It's not possible to fully make it impossible to add fake views but doing this will make it a lot harder and not worth it, and even at worst protects you way better.
{{% /callout %}}

Yes! Though as of writing this article it's a bit early to say it's perfect, but it's already in use on this blog. This blog is kind of my test run of it in production. There are some fixes and changes I'd like to add but it should be good enough for small static sites.

### How to install it

It's recommended to run it inside of docker. There is a premade [docker-compose.yaml](https://github.com/ChaoticLeah/simple-view-counter/blob/master/docker-compose.yml) file in the repo, but you can also build it from the source and run it. Instructions for both these things can be found in the readme. After installing it make sure you configure the config.yaml before running it.

### I have it installed, How do I use the API?

Since this is meant to count views across different sub-pages you are intended to have a unique ID or name for them(in this case I'm using the blog URL). You can encode the URL for this. So if I want to count a view on the key for the test I would send a **post** request to `/increment/test`. That's it; there is no fancy body or headers. It will return a 200 if a view was added, and a 429 (Too Many Requests) if you send another request for the same key in the next 12 hours (assuming that you left it at the default cooldown of 12 hours in the config). It will also always return a JSON that looks like this:
```js
{
 count: 12
}
```
12 in this case assumes that there are 12 views on the test key. If you want to view the count without incrementing it you can send a **get** request to `/test`. This will return the same JSON as above. 

## Can I contribute?

Yes, you can contribute. Feel free to make changes and submit a PR. This is just meant to be an API, and while we can add more features the number one goal is to keep it really lightweight and small so keep that in mind.