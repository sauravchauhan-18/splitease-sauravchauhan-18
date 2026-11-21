# SplitEasy

SplitEasy is a small expense tracker for people who share a flat, a meal, or a weekend away. Add the group, enter what someone paid, and see each person's equal share and the repayments that would settle the balance.

This is the first, frontend-only version. It runs in the browser and saves the current group on that device with `localStorage`; there is no account or server sync yet.

## Try it

1. Open `index.html` in a browser. No install or build step is needed. If your browser restricts local files, serve this folder with a static server such as VS Code Live Server.
2. Add the people sharing costs.
3. Enter an expense, its amount, and who paid. For example, add a ₹2,400 mess bill shared by three people; each person's share will be ₹800.
4. Check **The breakdown** to see the totals and suggested repayments. Use **Share summary** to copy a text summary.

## What it handles

- A named group with add and remove controls for members.
- Expenses with a description, amount, and payer.
- Equal splits across everyone currently in the group.
- Per-person shares and a simplified list of who should pay whom.
- A copyable summary and browser-local saving between visits.

## Current limits

Every expense is split equally across the whole group. You can't choose different participants or custom shares for an individual expense. Data stays in the browser where it was entered, so it won't sync between friends or devices. The app suggests balances; it doesn't move money.

## Built with

Plain HTML, CSS, and JavaScript. The page can be hosted as a static site on Vercel or Netlify.
