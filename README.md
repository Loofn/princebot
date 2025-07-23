# Prince Bot

Prince is a Discord bot designed for community moderation, anonymous venting, age verification, and interactive server features.

## Features

- **Anonymous Venting:** Users can post anonymously in a venting channel. Messages are embedded and attachments are re-uploaded for privacy.
- **Threaded Discussions:** Each vent message can have a dedicated thread for anonymous replies.
- **Age Verification:** Automated private threads for age verification with staff review.
- **Moderation Tools:** Staff can delete vent messages, verify users, and manage channels.
- **Audit Logging:** Important actions like vent message deletions are logged for transparency.
- **Interactive Games:** Includes features like a counting game with streak saving.

## Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your `serverRoles.json` and `channels.json` in the `data` directory.
4. Set up your database connection in `/function/db.js`.
5. Start the bot:
   ```bash
   node index.js
   ```

## Requirements

- Node.js v16 or higher
- Discord.js v14 or higher
- MySQL database

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

MIT
