---
title: Adding federated comments into my blog
description: How I implemented federated comments into my blog
slug: federated-blog-comments
# comment_post:
#   host: tech.lgbt
#   id: 115049741541024862
date: 2026-02-12 00:00:00+0000
image: cover.png
categories:
    - Programming
links:
    - title: The blog repo
      description: The repo containing all my blogs code
      website: https://github.com/ChaoticLeah/blog
    
# weight: 1       # You can add weight to some posts to override the default sorting (date descending)
---

A while ago, I wanted to add federated comments to my blog. At the time, I had come across [cactus comments](https://cactus.chat/) through matrix; however, this never ended up working when I tried to implement it in my site. It seemed some part of the project was dead, and I couldn't make it work. I even opened some issues on the repos which got no responses. I also thought about some sort of comments through Fedi however at the time, I thought that would require spinning up a whole Fedi server with the blog incorporated into it somehow, and it seemed like way too much work.

Some time passed, and I eventually encountered [enjarai](https://evy.pet/@enjarai) and [aurakles](https://evy.pet/@aurakle)s implementations allowing people to leave comments on their site, showing me that, actually, it was possible and that I had probably been silly and overthought it. I imediately went to their website containing a nice little federated guest book and opened up my dev tools and switched to the network tab to try and figure out what was going on and how it was working. I found it was using the mastodon API to grab all the comments under a post with the `/api/v1/statuses/{id}/context` endpoint. Feel free to take a look at the data on this endpoint [here](https://infosec.exchange/api/v1/statuses/116008909593393800/context) I also wondered if I could do more and allow the user to sign in with their instance to leave comments all on-site. This is something I had experience with on my few attempts to make my own Mastodon client, mainly [Tusklet](https://github.com/ChaoticLeah/Tusklet), so surely it could be done.

## The first few attempts and learnings

So now I had all the info that I needed, I could surely implement it myself. I also had a GTS server laying around that has the Mastodon API so I could run it all myself! Well, not so fast because it turns out that GTS implements the Mastodon API with some additions and in this case on the GTS API, the endpoint I needed requires a token which I didn't want to include in the blog frontend because I didn't know how bad it would be to just give out a token since I assume it could do more than just this.

Because of this, I decided to settle on using another mastodon instance: infosec.exchange since it's related to a lot of what my blog is about, and I have at least some experience around their instance and think that it's neat.

## Implementing it

It's been a while in native HTMl and JS but I started by making some custom components to display the comments. You can read more about this [here on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements). I was also experimenting with different ways to do larger chunks of dynamic elements in html and ended up with a bit of a weird HTML-string-builder thing. Not sure if it is at all recommended, but oh well.

### Implementing it in Hugo

In order to implement it in Hugo with my template, it allowed one to specify which comments provider to use. Fedi wasn't one of them, so I would need to figure out and add my own. I saw how they were being imported [here,](https://github.com/CaiJimmy/hugo-theme-stack/blob/master/layouts/_partials/comments/include.html) and I knew that in order to add something to this folder, all I needed to do was recreate the folder structure and add my comments like so:
```
layouts/partials/comments/provider
└── fedi.html
```

And then in the template code inside of `fedi.html`, would look like:

```html
{{ if .Params.comment_post }}
 {{ if and .Params.comment_post.host .Params.comment_post.id }}
 
  {{ $css := resources.Get "css/fedi-comments.css" }}
  {{ if $css }}
  <link rel="stylesheet" href="{{ $css.RelPermalink }}">
  {{ end }}
  
  {{ $js := resources.Get "js/fedi-comments.js" }}
  {{ if $js }}
  <script src="{{ $js.RelPermalink }}" defer></script>
  {{ end }}
  
  <fedi-comments host="{{ .Params.comment_post.host }}" id="{{ .Params.comment_post.id }}"></fedi-comments>
 {{ end }}
{{ end }}
```

You may notice me referencing something called `Params`, This is something I can stick at the top of each blogposts markdown file (also known as the frontmatter), allowing me to specify what Fedi post to link to, like so:
```yaml
comment_post:
 host: gay.meow   # The instance of the post
 id: 1234563464   # The id of the post
```

### Allowing you to leave comments on-site

You can also log into your mastodon-compatible Fedi instance and leave comments all on-site. This is done by registering an app, giving the user an oauth, and then saving the token in localstorage for when its needed. If the token exists, show the logged-in view, and when posting a comment, it uses that token. You can also leave a like on comments or reply to others.

Feel free to try it out below! (If your instance has a compatable mastodon API)


Also feel free to use this on your own Hugo site and feel free to let me know if you do on Fedi at [@ChaosKitsune@woem.men](https://woem.men/@ChaosKitsune)