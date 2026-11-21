# SplitEasy

SplitEasy is a shared-expense tracker. Week 1 is the standalone browser version in the repository root. Week 2 adds the React client in `client/` and an Express/MongoDB API in `server/`.

## Run Week 2 locally

1. Install Node.js 20.19 or newer.
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` to your MongoDB Atlas connection string. Keep this file private; it is ignored by Git.
3. From the repository root, install dependencies:

   ```powershell
   npm install
   ```

4. Start the API and React development server together:

   ```powershell
   npm run dev
   ```

   The API is at `http://localhost:5000`; the React client is at `http://localhost:5173`. Vite forwards `/api` requests to the API.

## API

The API uses Express routing and Mongoose models. The email mentions seven routes; complete create, list, edit, and delete coverage for both models needs eight method/path combinations, so this implementation includes all eight.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check that the API is running |
| GET | `/api/people` | List people |
| POST | `/api/people` | Add a person (`name`, optional `color`) |
| PUT | `/api/people/:id` | Edit a person |
| DELETE | `/api/people/:id` | Delete a person with no expenses |
| GET | `/api/expenses` | List expenses, including payer details |
| POST | `/api/expenses` | Add an expense (`title`, `amount`, `paidBy`) |
| PUT | `/api/expenses/:id` | Edit an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |

An expense payer must be an existing person. A person cannot be deleted while they are still linked to expenses. Validation and not-found errors return JSON messages.

Import `postman/SplitEasy Week 2.postman_collection.json` into Postman to try the API. Create a person first and copy its `_id` into the collection's `personId` variable before adding an expense.

## Data and deployment

Week 2 stores people and expenses in MongoDB. The group label remains local to the browser; there is no user login, group membership model, or payment processing in this milestone. The API requires a working Atlas URI before it can start. Do not commit a real connection string. For a deployed client, set `VITE_API_URL` to the deployed API URL and configure `CLIENT_ORIGIN` on the server.

The existing GitHub Pages URL still serves the Week 1 static page from the repository root. The Week 2 React app is run from `client/` and needs a deployed API before it can be used as a public full-stack app.
