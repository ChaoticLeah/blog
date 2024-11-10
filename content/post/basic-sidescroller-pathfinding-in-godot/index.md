---
title: Basic Sidescroller pathfinding in godot
description: How I did it for my train game
slug: basic-sidescroller-pathfinding-in-godot
date: 2024-11-10 20:48:58+0000
image: cover.webp
categories:
    - Programming
# tags:
#     - Example Tag
weight: 1       # You can add weight to some posts to override the default sorting (date descending)
---

## The quick answer 

You might be wondering how pathfinding in this game works. I had to write a custom pathfinding solution since Godot does not support side view pathfinding. The solution is actually quite simple. There is a pathfinding grid made up on a bunch of connected nodes. Each NPC can pathfind between nodes using a the [Dijkstra algorithm](https://en.wikipedia.org/wiki/Dijkstra's_algorithm.)

## So how do I have public and private rooms?

Nodes (the points that can be pathfinded to) have a property telling the game if its a public or a private node. If its private they will also have an allow list that saves all the allowed NPCs that can use it. If an NPC tries to pathfind here then the pathfinder will fail. More specifically the door node is a private node. This is enough to make sure everyone else stays out and is flexible enough for me to allow for inviting friends over or whatever if such a feature is needed in the future.

## Some more detail

Pathfinding is usually started in 1 of 2 ways. Because an NPC is wandering, or because an NPC is trying to complete a task. When wandering its very simple. A random point is picked and they try to go there.

{{% callout title="Note About Wandering" %}}
In the future I plan to rework this so that wandering uses a much simpler pathfinding solution because right now if that random point that is picked is in a room they cant access it will compute the path, fail, pick a new point, and keep doing this until it finds a ok point to go to. In the future I plan to try some sort of noise to control how they move with no real pathfinding.
{{% /callout %}}

When an NPC starts a task it probably needs to go somewhere. For example if an NPC needs the bathroom it will search for the closest bathroom and then rank the closest ones by how busy they are to try avoid long lines and promote users placing more to even out lines. After a bathroom (or other buildable) is picked it will use the [Dijkstra algorithm](https://en.wikipedia.org/wiki/Dijkstra's_algorithm) to precompute the path it needs to take. Then it will slowly make its way there, and once there its pathfinding will be done and the buildable will likely take over control of the NPC. In the case of the bathroom the buildable will put them in line. If there is no line then they turn invisible (to the player it looks like they went inside of the bathroom) and then the bathroom does the rest of its job.

## How are new nodes linked?

When building nodes are linked usually automatically. Each buildable has a pathfinding node on it and so it will try to automatically register itself into the network and then find which 2 nodes its inbetween. After it has found this out it will cut these 2 apart so they are no longer linked. After that it will link those 2 to itself and itself to those 2 nodes (so its a 2 way link. Yes this pathfinding system supports 1 way pathfinding but the auto registering doesnt support it). Thats it, for most buildables thats the end of it, but there is 1 thing that breaks this: Stairs. Unlike every other buildable its not a task buildable and has 2 pathfinding nodes (A top and bottom node)
![Some pixel art stairs with a pathfinding debug overlay showing 2 points at the top and bottom that are connected](Stairs-Pathfinding-On.png "Stairs Pathfinding")

So here is almost the same case but I had to manually register the nodes since the auto register would unlink the 2. Its also one of the few cases where 3 links will occur. Its also the only case in my game where pathfinding goes up or down vertically so its marked a darker blue to signify that. For now this doesn't do much but could be used to trigger a custom walk down stairs animation or something.

## Edge cases

What happens when a node is deleted that an NPC is going to pathfind to? Its pathfinding will fail. This used to crash the game but now it shouldn't. If this happens it will fail the task and start over trying to find a new path there. If it was between points it will first navigate to the nearest point and then continue to pathfind.

## Debugging

As you can see in the screenshot above I have built some visual tools to help figure out how nodes are linked. This helped a great deal to ensure they were all linked right.

## Future optimizations 

Right now when NPCs are looking for a bathroom for example they will look for the nearest one that isn't too crowded. This sounds good on paper but if every room has a private bathroom in it then it will try and fail a many times before it finds a bathroom it can actually pathfind to. This is bad. Originally I had this problem with beds too. I want to make it so that buildable will add themselves to a public list if they are in a public space. If not they wont be checked. If you build a bathroom in a room it wont be added to the list however when an NPC needs the bathroom it will also consider the private things in its own room since it has access there as well as everything in the public list.