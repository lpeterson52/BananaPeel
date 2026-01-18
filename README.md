# BananaPeel
Mobile app to sort recycling based on photos. This repository contains the source code for the front end of the application.

## Inspiration
Inspired by Yuka, we wanted to make an app that was easy to pick up, to reduce the burden of information finding when trying to decide how to sort waste. To gamify it, we wanted to add a leaderboard similar to the one offered in Transit's GO system. This would keep user engagement and give them an extra reason to do an otherwise tedious task.

## What it does
BananaPeel uses a phone camera to take a photo of a piece of trash, and classifies it based on the material. It will then offer advice as to how to sort the waste, as well as store it in a history for easy recollection. There is also a leaderboard section, where users' device IDs are turned into anonymous playful names to compete with each other, without having to make an account. Yuka and Transit do this by default, and it's nice to be able to pick up an app and immediately be able to access all of its features.  

## How we built it
Starting with React-native + Expo template, we modified the pre-existing tabs to feel our way through how we wanted to structure the app. Five pages eventually reduced to three, as we found ways to combine ideas like a Search and History tab into one to best fit the time constraint and end-goal of the project. A big part of the project was searching for an ample AI/ML model to process our images through, which we ended up using Roboflow's API to handle, removing the need for a computer-vision backend altogether. Processing can be done with a single API call, which lets us focus our resources on integrations within the app, while keeping the future flexible if we ever wish to train our own model. We built a system that can potentially use data from users to help improve future predictions for classification models. We then had extra time to build a leaderboard, which we used FastAPI, MongoDB, and Railway to implement a ranking system for users. 

## Challenges we ran into
- Getting an optimal model for the recognition
- Spent 4 hours building a backend for the vision, just to scratch it
- Unfamiliarity with Expo and React-native
- Live share in VSCode had major desync issues
- inference w/ roboflow (when trying to run locally) is extremely unintuitive and requires Python 3.12 or older, which conflicted with other dependencies 
- npm, pnpm, yarn, bun... there's always a wrong option.

## Accomplishments that we're proud of
- Computer vision with Roboflow
- Microinteractions in UI
- Liquid glass implementation
- Searchable history
- First mobile app
- First time using MongoDB+FastAPI
- Transit-inspired anonymous leaderboard
- Very fast leaderboard fetching

## What we learned
- Finding a suitable waste classification model proved much more difficult than initially anticipated.
- We should have started with a smaller scope-- we definitely didn't need a Discovery tab.
- It's OK to pivot ideas. The best idea is usually *not* the one you start with.
- Typescript doesn't always check types at runtime for cross-file function calls.
- There are slight differences in how style sheets are handled in HTML, React, and Expo. For example, Expo does not automatically balance font size and container height as HTML does-- you must manually add a lineHeight style modifier.

## What's next for BananaPeel
Bigger AI models, crowdsourcing training via the questionnaire feature, ability to customize profiles, and color themes! Overall, quicker classification. We want to expand the questionnaire feature and potentially add a feature where you can identify different objects within a taken image, training a new model. Upgrading from image classification to object detection would allow us to highlight multiple objects per image, offering more detailed and accurate results. This can be used to help high-tier recycling plants sort their waste, which would benefit people around the world instantly. One crowdsourced image for training by 1000 users can already outperform most waste-sorting models currently available. 