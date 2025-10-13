# Gramados Job System

This module implements a job system for the Gramados modded Minecraft RP server (1.12.2). It allows players to take on various jobs, earn money, and manage their job history.

## Features

- **Job Types**: Jobs are categorized into `Starter`, `Advanced`, and `Prestige` types.
- **Region-Specific Jobs**: Jobs are tied to specific regions, with limits on the number of active jobs per type in each region. Players gain eligibility by owning the region or being on its trusted list.
- **Permissions Management**: Automatically assigns and removes permissions based on active jobs.
- **Job History**: Tracks the history of jobs players have taken, including start and end times.
- **Dynamic Updates**: Ensures compatibility with new features by updating player data as needed.

## Job Types

1. **Starter Jobs**:
   - Free to join and require little to no investment from players.
   - Ideal for new players to earn their first income upon joining the server.
   - Examples: Lumberjack, Factory Worker.

2. **Advanced Jobs**:
   - Considered the "basic standard" job type.
   - Require players to purchase infrastructure (e.g., a farm, repair shop, or factory) to unlock the job.
   - Examples: Farmer, Mechanic.

3. **Prestige Jobs**:
   - Late-game job type requiring significant investment.
   - Require players to remain active, as they involve maintaining reputation and upgrading workspaces.
   - Examples: Owning a wine domain, upgrading vineyards, and producing a variety of wines, from standard bottles to high-quality vintage wines.

## Files

- **`jobs_log.json`**: Stores all job-related data, including job definitions, region limits, and player-specific job data.
- **`job_manager.js`**: The main script that manages job-related functionality, including initialization, job assignment, and permission updates.

## How It Works

1. **Initialization**:
   - When a player joins, their data is initialized in `jobs_log.json` if not already present.
   - The system ensures all active jobs and job history entries are up-to-date.

2. **Job Assignment**:
   - Players can take on jobs by interacting with NPCs or dialogs.
   - The system checks region-specific job limits before assigning a job.

3. **Permissions**:
   - Job-specific permissions are automatically granted when a player starts a job.
   - Permissions are removed when a player quits a job.

4. **Job Quitting**:
   - Players can quit jobs after working for a minimum duration (e.g., 24 in-game hours).
   - Quitting a job moves it to the player's job history.

5. **Data Persistence**:
   - All job data is saved to `jobs_log.json` to ensure persistence across server restarts.

## Configuration

### Region Job Limits

Region-specific job limits are defined in the `Region_Job_Limits` section of `jobs_log.json`. Example:

```json
"Region_Job_Limits": {
    "Gramados": {
        "Starter": 2,
        "Advanced": 3,
        "Prestige": 1
    }
}
```

### Job Definitions

Jobs are defined in the `Jobs` array in `jobs_log.json`. Example:

```json
{
    "JobID": 59,
    "JobLock": 60,
    "JobQuit": 441,
    "Type": "Starter",
    "JobName": "Lumberjack",
    "Region": "Gramados",
    "Perms": [
        "permission_regions.gramados_lumberjack"
    ]
}
```

## Adding New Jobs

1. Add the job definition to the `Jobs` array in `jobs_log.json`.
2. Define the necessary permissions in the `Perms` field.
3. Update the `Region_Job_Limits` section if needed.

## Commands and Debugging

- **Broadcast Messages**: The script uses `world.broadcast` for debugging and notifications.
- **Error Handling**: Errors such as missing job data or exceeding job limits are communicated to players.

## Future Improvements

- Add support for custom job rewards.
- Implement a GUI for job management.
- Enhance job history tracking with more detailed statistics.

## Credits

## Notes on Trusted Access

- Advanced and other auto-assigned jobs that require a region will be granted automatically if the player either owns the region or is listed in the region's `trusted` array.
- If a player loses ownership or is removed from the `trusted` list of all qualifying regions for a job, that job will be revoked automatically.
- The dynamic `jobs.json` stores two extra fields when a job is granted via region access:
   - `Source`: e.g., `auto-region-owner`, `auto-region-trusted`, or `dialog-join`.
   - `RegionAccess`: `owner` or `trusted` (only present for region-based grants). These fields are also archived in `JobHistory` when a job ends.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
