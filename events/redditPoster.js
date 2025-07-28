const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const client = require('..');
// Persistent storage for sent post IDs
const SENT_POSTS_FILE = path.join(__dirname, '../data/sentRedditPosts.json');
let sentPostPermalinks = [];
try {
    sentPostPermalinks = JSON.parse(fs.readFileSync(SENT_POSTS_FILE, 'utf8'));
} catch (e) {
    sentPostPermalinks = [];
}

// Persistent queue for unsent posts
const QUEUE_FILE = path.join(__dirname, '../data/redditPostQueue.json');
let postQueue = [];
try {
    postQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
} catch (e) {
    postQueue = [];
}

// CONFIGURE THESE
const CHANNEL_ID = '1398457578215702568'; // Set your target channel ID here
const SUBREDDITS = [
    { subreddit: 'HungTwinks', type: 'hot', limit: 100 },
    { subreddit: 'MassiveCock', type: 'hot', limit: 100 },
    { subreddit: 'TwinkCockandFeet', type: 'hot', limit: 100 },
    { subreddit: 'TwinkBDSM', type: 'hot', limit: 100 },
    { subreddit: 'twinks', type: 'hot', limit: 100 },
    // Add more subreddits as needed
    // { subreddit: 'cats', type: 'new', limit: 2 },
];

async function getRedditAccessToken() {
    const {
        REDDIT_CLIENT_ID,
        REDDIT_CLIENT_SECRET,
    } = process.env;
    const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
    });
    if (!res.ok) throw new Error('Failed to get Reddit access token');
    const data = await res.json();
    return data.access_token;
}

async function fetchRedditPosts(subreddit, type = 'hot', limit = 1) {
    const url = `https://www.reddit.com/r/${subreddit}/${type}.json?limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch subreddit');
    const data = await res.json();
    return data.data.children.map(child => child.data);
}

async function postRedditEmbeds() {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.error('RedditPoster: Channel not found:', CHANNEL_ID);
        return;
    }
    // Add new posts to the queue
    for (const config of SUBREDDITS) {
        try {
            const posts = await fetchRedditPosts(config.subreddit, config.type || 'hot', config.limit || 1);
            const imagePosts = posts.filter(post => post.url && (post.url.endsWith('.jpg') || post.url.endsWith('.png') || post.url.endsWith('.jpeg')));
            // Only add posts that are not in sentPostPermalinks and not already in the queue
            for (const post of imagePosts) {
                const permalink = post.permalink ? post.permalink : `${config.subreddit}/${post.id}`;
                if (!sentPostPermalinks.includes(permalink) && !postQueue.some(q => (q.permalink ? q.permalink : `${config.subreddit}/${q.id}`) === permalink)) {
                    postQueue.push(post);
                }
            }
        } catch (err) {
            console.error(`Reddit fetch/post error for r/${config.subreddit}:`, err);
        }
    }
    // Save queue
    try {
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(postQueue, null, 2));
    } catch (e) {
        console.error('RedditPoster: Failed to write post queue:', e);
    }

    // Post up to 5 from the queue
    const postsToSend = postQueue.slice(0, 5);
    for (const post of postsToSend) {
        try {
            const embed = new EmbedBuilder()
                .setTitle(post.title)
                .setURL(`https://reddit.com${post.permalink}`)
                .setColor('#FF4500')
                .setFooter({ text: `Posted by u/${post.author}` })
                .setTimestamp(new Date(post.created_utc * 1000));
            embed.setImage(post.url);
            await channel.send({ embeds: [embed] });
            const permalink = post.permalink ? post.permalink : `${post.subreddit}/${post.id}`;
            sentPostPermalinks.push(permalink);
        } catch (e) {
            console.error('RedditPoster: Failed to send post:', e);
        }
    }
    // Remove sent posts from queue and save
    postQueue = postQueue.slice(postsToSend.length);
    try {
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(postQueue, null, 2));
        fs.writeFileSync(SENT_POSTS_FILE, JSON.stringify(sentPostPermalinks, null, 2));
    } catch (e) {
        console.error('RedditPoster: Failed to update queue or sent posts:', e);
    }
}

module.exports = { postRedditEmbeds };
