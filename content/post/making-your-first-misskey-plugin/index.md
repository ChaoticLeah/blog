---
title: Making your first misskey plugin
description: All the stuff you need to get started with plugin and widget development with misskeys AIscript
slug: making-your-first-misskey-plugin
date: 2024-04-01 00:00:00+0000
# image: cover.jpg
categories:
    - Programming
    - Tutorial
tags:
    - AIscript
links:
    - title: Original blog post
      description: Mirror of this blog post on my blog
      website: https://blog.winter-software.com/2024/04/01/Making_Your_First_Misskey_Plugin
    - title: AIscript Get Started
      description: GitHub page with basics of AIscript syntax in English
      website: https://github.com/aiscript-dev/aiscript/blob/master/translations/en/docs/get-started.md
    - title: Misskey API documentation
      description: API documentation for Misskey
      website: https://misskey.io/api-doc
    - title: AIscript online testing tool
      description: Tool for testing AIscript code with better error feedback
      website: https://aiscript-dev.github.io/aiscript/
    - title: AIscript English docs
      description: English documentation for AIscript language
      website: https://github.com/aiscript-dev/aiscript/tree/master/translations/en/docs
    - title: Misskey Hub Plugin API reference
      description: Plugin API reference for Misskey
      website: https://misskey-hub.net/en/docs/for-developers/plugin/plugin-api-reference/
    - title: Plugin header docs
      description: Documentation for creating a plugin header for Misskey
      website: https://misskey-hub.net/en/docs/for-developers/plugin/create-plugin/
    - title: Visual Studio Marketplace AIscript plugin
      description: VS Code plugin for AIscript syntax highlighting
      website: https://marketplace.visualstudio.com/items?itemName=ThatOneCalculator.aiscript
    - title: Pronoun Plugin by ChaosKitsune
      description: GitHub page for the Pronoun Plugin
      website: https://github.com/ChaoticLeah/pronoun-plugin
    - title: Plugin page
      description: Example plugins I made. Contains an older pronoun plugin, and a smaller plugin I wrote.
      website: https://woem.men/@ChaosKitsune/pages/1704460749056
    - title: Plural Plugin
      description: The plural plugin code and instructions
      website: https://woem.men/@ChaosKitsune/pages/1711151651951

# weight: 1       # You can add weight to some posts to override the default sorting (date descending)
---

This is a mirror of my blogpost [here](https://blog.winter-software.com/2024/04/01/Making_Your_First_Misskey_Plugin).

Do you want to make a plugin for all the various key software that exist out there? Well in this blog I will be writing about making a basic plugin and explaining the basics of AIscript. Later I may make a follow-up post on more advanced stuff related to misskey plugins, widgets, and plays development.

## The basics of AIscript

AIscript is a weird very specific language that won't compile if a space is missing or something like that. Usually in other languages, this is not an issue, but here you better keep all your code clean and organized because otherwise it won't compile. This has stumped me many times before so make sure you pay attention to this.
I'm not going to teach the very basic syntax since that can be viewed [here on github](https://github.com/aiscript-dev/aiscript/blob/master/translations/en/docs/get-started.md) in English. Instead, I'll talk about the things it doesn't go over.

This basic program below won't run:

```js
let a=10

if a==10{
  print(a)
}
```

The reason for this is that there is not a space between the 10 and the opening squiggly bracket. Keep in mind it doesn't care if there is no spacing around your variable declarations. In various examples, you may find you might see different ways to do things. I prefer to use `print("Hi")` but `<: "Hi"` works too. Also, you may notice that using the keyword `return` is optional for example both

```js
@multipleByTwo(x) {
	(x * 2)
}
```

or

```js
@multipleByTwo(x) {
	return (x * 2)
}
```

are valid and work. Also, keep in mind that if statements can return things too.

### Variables
There are 2 ways to make a new variable in AIscript.
`let a = 10` or `var a = 10`

So what's the difference? if you go with `let` it won't let you reassign it. It's a constant now. `var` on the other hand lets you reassign it to a new value.

Also, keep in mind when making a plugin or anything in AIscript that it is a bit of a pain to test in misskey. The process for testing and debugging is to add it like a normal plugin and if it fails remove it, change the code, and add it again. This can be slow but for now, it's the only way to test it. Eventually, you get pretty good at not making silly mistakes and you can use some of the tools below to speed stuff up so you don't have to go through all this.

## Making a plugin

For a plugin to be accepted by any key software it needs to include some metadata at the top of the file. Let's take a look at the metadata for my pronoun plugin.

```js
/// @ 0.12.4
### {
  name: "Pronouns in name"
  version: "2.1.3"
  author: "@ChaosKitsune@woem.men"
  description: "This will try to put the user's pronouns in their name on any given post"
  permissions: null
  config: {
		experimentalDescMethod: {
			type: 'boolean'
			label: 'Use experimental algorithm'
			description: 'This could put some random stuff in their name, but also will allow for more accurate pronouns'
			default: false
		},
        debugExperimentalDescMethod: {
			type: 'boolean'
			label: 'Debug experimental algorithm'
			description: 'Prints the data related to the setting above'
			default: false
		},
        checkFields: {
			type: 'boolean'
			label: 'Check Fields'
			description: 'If its crashing try disabling this'
			default: true
		},
        debug: {
			type: 'boolean'
			label: 'Debug'
			description: 'If it fails to find pronouns it will put (unknown) at the end of the name'
			default: false
		}
    }
}
```

In the first line, we are saying what version of the language we want to use. It won't run without it. I suggest just using the version I have here. Inside here you will see the name of the plugin, the version of the plugin (This can be anything, note that a v is appended before this when it's shown to the user so I suggest not putting a v), and the author for credit. You can also see the permissions here which is either null or an array of strings stating all the permissions your plugin needs based on what API endpoints your plugin may use. You can find all that [here on misskey.io](https://misskey.io/api-doc) if you plan on doing that. Under that, you will see the config. This is shown in the UI and allows users to intuitively enable and disable features or whatever you want for your plugin. In this example, it only shows booleans being used but it supports things like strings if you input `string` instead. If I wanted to get the value of the debug variable I just needed to do `Plugin:config.debug` Keep in mind that when you update the plugin all the variables will be reset to their defaults.

### The actual plugin

Once you have all that set up there are a lot of different ways you can go. Depending on what you want to do with the plugin this bit will look very different but most of the time you will register an action or interrupter. You can check all those out [here](https://misskey-hub.net/en/docs/for-developers/plugin/plugin-api-reference/).

For this example, I will be writing a quick plugin that replaces meows in any post with woems.

```js
/// @ 0.12.4
### {
  name: "Woemer"
  version: "1.0.0-aiscript0.12.4"
  author: "@ChaosKitsune@woem.men"
  description: "Converts meows to woems"
  permissions: null
  config: null
}


Plugin:register_note_view_interruptor(@(note) {
  note.text = Str:replace(note.text, "meow", 'woem')
  return note
})
```

As you can see we registered a note view interruptor. What this does is before the post is shown to the viewer (you or whoever may install your plugin) it changes its contents. This doesn't actually change the post, it's almost the same as if you were to manually go into inspect element and edit it. It's a change only you will see. Anyways it takes the text of the note and replaces all instances of `meow` with `woem`. There are many other things here you can edit such as the name of the user who posted it. This is exactly what I do with my pronoun plugin to display pronouns in the username.

Again keep in mind that there are many different types of actions and interrupters, some change stuff only for you, and some like the `register_note_post_interruptor` edit the post right before it is posted so everyone can see these changes.

### API Endpoints

But what if we wanted to do some fancy stuff with the misskey API? As mentioned before you can look [here](https://misskey.io/api-doc) for all the endpoints but for this demo we will just be making it send a notification when the plugin is installed correctly.

First off we are going to need to specify we want to use notifications in the header bit like so `permissions: ["write:notifications"]`. In the docs, we can see it takes a body, a header, and a URL to an image. Only the body is required.

I wrote this nice function that allows you to easily use notifications in your plugin. I also included but commented out the header and icon. If you want to use them feel free to add them back

```js
@send_notification(message){
    Mk:api("notifications/create", {
        body: message, 
        //header: "Header Text",
        //icon: "url here"
    }) 
}
```

Now we could just call that and it would work however it would send a notification each time the tab reloaded, or a new tab was opened. That would be super annoying! If we just want to send a notification on installation we can save some data. Saved data is isolated and no other plugin can access your plugin's saved data though keep in mind your plugin loses all its saved data on update since you have to delete and re-add the plugin to update it.

Here is how you could use that to make it only send the notification once.

```js
if Mk:load("notFirstTime") != true {
        send_notification("Plugin installed!");
        Mk:save("notFirstTime", true)
}
```

Saving stuff is super useful.

## Installing and distributing the plugin

Right now there is no place to put your plugin for others to find so you have to get it around by word of mouth on fedi. I hope to sometime fix this and make some sort of site where people can put their plugins that they made if this becomes more popular.

The way to install it is to put the code somewhere people can just copy and paste it into their settings under plugins. Yes, its a bit of a pain for the user but it's the only way for now.

## Extra tools and resources to help

Want to test or get a better error message as to why your program isn't compiling?
Go to [aiscript github page](https://aiscript-dev.github.io/aiscript/)

Need the English docs to the language?
Go to [aiscript english docs](https://github.com/aiscript-dev/aiscript/tree/master/translations/en/docs)

Looking for how to use the API?
Go to [misskey-hub plugin api docs](https://misskey-hub.net/en/docs/for-developers/plugin/plugin-api-reference/)

Need more docs on the plugin header?
Go [Here](https://misskey-hub.net/en/docs/for-developers/plugin/create-plugin/)

Looking for all the API endpoints?
Go to [misskey api docs](https://misskey.io/api-doc)

If you want to edit your AIscript in vscode here is a useful plugin I use for syntax highlighting: [visual studio marketplace](https://marketplace.visualstudio.com/items?itemName=ThatOneCalculator.aiscript).

## Some last notes

Keep in mind AIscript is kinda weird, and I have run into bugs. For example, the `register_note_post_interruptor` is somewhat broken and won't work right away even with the examples. Long story short it converted some API undefineds to nulls and this became an issue. Here is the fix if you need it:

```js

Plugin:register_note_post_interruptor(@(note) {
    //My fix for misskeys broken AIscript
    var newPost = {}
    let keys = Obj:keys(note)
    for let i, keys.len {
      let key = keys[i]
      if note[key] != null {
        newPost[key] = note[key] 
      }
    }
   //Do the stuff you normally would here like editing the text
    return newPost
})
```

I also recommend looking over plugins other people made and learning from them. Here are some of my plugins if you want to look at the code:
[My pronoun plugin](https://github.com/ChaoticLeah/pronoun-plugin)

https://woem.men/@ChaosKitsune/pages/1704460749056
https://woem.men/@ChaosKitsune/pages/1711151651951