# governance

## Public Methods

### `init`

Initialize governance with token and parameters. `voting_period`: ledgers for voting (e.g., 17280 = ~1 day at 5s/ledger) `timelock_delay`: ledgers before execution (e.g., 86400 = ~5 days) `quorum_bps`: minimum participation (e.g., 400 = 4% of supply) `threshold_bps`: minimum approval (e.g., 6000 = 60% of votes cast)

```rust
pub fn init(env: Env, admin: Address, governance_token: Address, voting_period: u32, timelock_delay: u32, quorum_bps: u32, threshold_bps: u32) -> Result<(), Error>
```

#### Parameters

| Name               | Type      |
| ------------------ | --------- |
| `env`              | `Env`     |
| `admin`            | `Address` |
| `governance_token` | `Address` |
| `voting_period`    | `u32`     |
| `timelock_delay`   | `u32`     |
| `quorum_bps`       | `u32`     |
| `threshold_bps`    | `u32`     |

#### Return Type

`Result<(), Error>`

### `propose`

Create a new proposal. Anyone can propose. `payload_hash`: SHA-256 of the action to execute (verified at execution)

```rust
pub fn propose(env: Env, proposer: Address, proposal_id: u64, payload_hash: BytesN<32>) -> Result<(), Error>
```

#### Parameters

| Name           | Type         |
| -------------- | ------------ |
| `env`          | `Env`        |
| `proposer`     | `Address`    |
| `proposal_id`  | `u64`        |
| `payload_hash` | `BytesN<32>` |

#### Return Type

`Result<(), Error>`

### `vote`

Cast a vote on an active proposal. `support`: true = for, false = against `weight`: voter's token balance at time of vote (verified on-chain)

```rust
pub fn vote(env: Env, proposal_id: u64, voter: Address, support: bool) -> Result<(), Error>
```

#### Parameters

| Name          | Type      |
| ------------- | --------- |
| `env`         | `Env`     |
| `proposal_id` | `u64`     |
| `voter`       | `Address` |
| `support`     | `bool`    |

#### Return Type

`Result<(), Error>`

### `queue`

Queue a succeeded proposal into the timelock. Anyone can call. Requirements: voting ended, quorum reached, threshold met

```rust
pub fn queue(env: Env, proposal_id: u64) -> Result<(), Error>
```

#### Parameters

| Name          | Type  |
| ------------- | ----- |
| `env`         | `Env` |
| `proposal_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `execute`

Execute a queued proposal after timelock. Anyone can call. `payload_hash_verify`: must match stored hash (prevents bait-and-switch)

```rust
pub fn execute(env: Env, proposal_id: u64, payload_hash_verify: BytesN<32>) -> Result<(), Error>
```

#### Parameters

| Name                  | Type         |
| --------------------- | ------------ |
| `env`                 | `Env`        |
| `proposal_id`         | `u64`        |
| `payload_hash_verify` | `BytesN<32>` |

#### Return Type

`Result<(), Error>`

### `cancel`

Admin can cancel a proposal at any state (emergency function). This is a privileged operation that requires admin authorization.

```rust
pub fn cancel(env: Env, admin: Address, proposal_id: u64) -> Result<(), Error>
```

#### Parameters

| Name          | Type      |
| ------------- | --------- |
| `env`         | `Env`     |
| `admin`       | `Address` |
| `proposal_id` | `u64`     |

#### Return Type

`Result<(), Error>`

#### Authorization

- Must be called by the admin address
- Requires admin signature

#### State Transitions

- **From**: Any state except `EXECUTED` or `CANCELLED`
- **To**: `CANCELLED`

### `cancel_stale`

Cancel a queued proposal that has exceeded the execution window. Anyone can call this function to clean up stale proposals and prevent governance stagnation.

```rust
pub fn cancel_stale(env: Env, proposal_id: u64) -> Result<(), Error>
```

#### Parameters

| Name          | Type  |
| ------------- | ----- |
| `env`         | `Env` |
| `proposal_id` | `u64` |

#### Return Type

`Result<(), Error>`

#### Authorization

- No authorization required (permissionless)
- Anyone can call to clean up stale proposals

#### Execution Window Rules

| Parameter                | Value                | Description                         |
| ------------------------ | -------------------- | ----------------------------------- |
| `execution_window`       | `timelock_delay * 2` | Time allowed to execute after `eta` |
| Example (timelock=50)    | 100 ledgers          | ~500 seconds at 5s/ledger           |
| Example (timelock=86400) | 172800 ledgers       | ~10 days at 5s/ledger               |

#### Requirements

- Proposal must be in `STATE_QUEUED`
- Current ledger must be >= `eta + execution_window`
- Execution window = `timelock_delay * 2` (conservative default)

#### State Transitions

- **From**: `QUEUED` only
- **To**: `CANCELLED`

#### Rejection Cases

| Condition                      | Error                  | Reason                                          |
| ------------------------------ | ---------------------- | ----------------------------------------------- |
| Proposal not in `QUEUED` state | `InvalidProposalState` | Only queued proposals can be cancelled as stale |
| Execution window not expired   | `TimelockNotExpired`   | Proposal can still be executed                  |
| Proposal already executed      | `InvalidProposalState` | Cannot cancel executed proposals                |
| Proposal already cancelled     | `InvalidProposalState` | Cannot cancel twice                             |

#### Security Considerations

- **Prevents queue flooding**: Malicious actors cannot indefinitely accumulate stale proposals
- **Governance responsiveness**: Ensures only current, relevant proposals remain in queue
- **Conservative window**: 2x timelock delay provides ample time for legitimate execution
- **Permissionless**: No central authority needed for cleanup

#### Usage Example

```rust
// Queue a proposal
gov_client.queue(&proposal_id);

// After execution window expires (eta + timelock_delay * 2)
// Anyone can cancel the stale proposal
gov_client.cancel_stale(&proposal_id);
```

### `get_proposal`

Get proposal details

```rust
pub fn get_proposal(env: Env, proposal_id: u64) -> Result<Proposal, Error>
```

#### Parameters

| Name          | Type  |
| ------------- | ----- |
| `env`         | `Env` |
| `proposal_id` | `u64` |

#### Return Type

`Result<Proposal, Error>`

### `has_voted`

Check if an address has voted on a proposal

```rust
pub fn has_voted(env: Env, proposal_id: u64, voter: Address) -> bool
```

#### Parameters

| Name          | Type      |
| ------------- | --------- |
| `env`         | `Env`     |
| `proposal_id` | `u64`     |
| `voter`       | `Address` |

#### Return Type

`bool`
