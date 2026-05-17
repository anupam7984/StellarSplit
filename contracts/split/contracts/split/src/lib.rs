#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, vec, Address, Env, String, Vec, Symbol};

#[derive(Clone)]
#[soroban_sdk::contracttype]
pub enum TabStatus {
    Open,
    Closed,
}

#[derive(Clone)]
#[soroban_sdk::contracttype]
pub struct Tab {
    pub id: u64,
    pub name: String,
    pub members: Vec<Address>,
    pub creator: Address,
    pub created_at: u64,
    pub status: TabStatus,
}

#[derive(Clone)]
#[soroban_sdk::contracttype]
pub struct Expense {
    pub id: u64,
    pub tab_id: u64,
    pub description: String,
    pub amount: i128,
    pub paid_by: Address,
    pub split_between: Vec<Address>,
    pub created_at: u64,
}

const TAB_COUNT: Symbol = symbol_short!("TAB_CNT");
const TAB_PREFIX: Symbol = symbol_short!("TAB");
const EXPENSE_PREFIX: Symbol = symbol_short!("EXP");

#[contract]
pub struct SplitContract;

#[contractimpl]
impl SplitContract {
    pub fn create_tab(env: Env, caller: Address, name: String, members: Vec<Address>) -> u64 {
        caller.require_auth();
        let created_at = env.ledger().sequence() as u64;
        let caller_addr = caller.clone();

        let mut all_members = vec![&env, caller_addr.clone()];
        for m in members.iter() {
            all_members.push_back(m);
        }

        let tab_count: u64 = env.storage().instance().get(&TAB_COUNT).unwrap_or(0);
        let new_tab_id = tab_count + 1;

        let tab = Tab {
            id: new_tab_id,
            name,
            members: all_members.clone(),
            creator: caller_addr,
            created_at,
            status: TabStatus::Open,
        };

        let tab_key = (TAB_PREFIX, new_tab_id);
        env.storage().instance().set(&tab_key, &tab);

        let expense_count_key = (TAB_PREFIX, new_tab_id, symbol_short!("CNT"));
        env.storage().instance().set(&expense_count_key, &0u64);

        env.storage().instance().set(&TAB_COUNT, &new_tab_id);

        new_tab_id
    }

    pub fn add_expense(
        env: Env,
        caller: Address,
        tab_id: u64,
        description: String,
        amount: i128,
        paid_by: Address,
        split_between: Vec<Address>,
    ) -> u64 {
        caller.require_auth();
        let caller_addr = caller.clone();

        let tab_key = (TAB_PREFIX, tab_id);
        let tab: Tab = env
            .storage()
            .instance()
            .get(&tab_key)
            .expect("TabNotFound");

        if let TabStatus::Closed = tab.status {
            panic!("TabClosed");
        }

        let mut is_member = false;
        let members_vec = tab.members;
        for i in 0..members_vec.len() {
            if let Some(m) = members_vec.get(i) {
                if m == caller_addr {
                    is_member = true;
                    break;
                }
            }
        }
        if !is_member {
            panic!("NotAMember");
        }

        let mut paid_by_is_member = false;
        for i in 0..members_vec.len() {
            if let Some(m) = members_vec.get(i) {
                if m == paid_by {
                    paid_by_is_member = true;
                    break;
                }
            }
        }
        if !paid_by_is_member {
            panic!("SplitMemberNotInTab");
        }

        if split_between.is_empty() {
            panic!("EmptySplitList");
        }

        for i in 0..split_between.len() {
            if let Some(member) = split_between.get(i) {
                let mut found = false;
                for j in 0..members_vec.len() {
                    if let Some(m) = members_vec.get(j) {
                        if m == member {
                            found = true;
                            break;
                        }
                    }
                }
                if !found {
                    panic!("SplitMemberNotInTab");
                }
            }
        }

        if amount <= 0 {
            panic!("InvalidAmount");
        }

        let expense_count_key = (TAB_PREFIX, tab_id, symbol_short!("CNT"));
        let expense_count: u64 = env
            .storage()
            .instance()
            .get(&expense_count_key)
            .unwrap_or(0);

        let new_expense_id = expense_count + 1;

        let expense = Expense {
            id: new_expense_id,
            tab_id,
            description,
            amount,
            paid_by,
            split_between,
            created_at: env.ledger().sequence() as u64,
        };

        let expense_key = (EXPENSE_PREFIX, tab_id, new_expense_id);
        env.storage().instance().set(&expense_key, &expense);

        env.storage().instance().set(&expense_count_key, &(expense_count + 1));

        new_expense_id
    }

    pub fn close_tab(env: Env, caller: Address, tab_id: u64) {
        caller.require_auth();

        let tab_key = (TAB_PREFIX, tab_id);
        let tab: Tab = env
            .storage()
            .instance()
            .get(&tab_key)
            .expect("TabNotFound");

        if caller != tab.creator {
            panic!("Unauthorized");
        }

        let mut updated_tab = tab;
        updated_tab.status = TabStatus::Closed;
        env.storage().instance().set(&tab_key, &updated_tab);
    }

    pub fn get_tab(env: Env, tab_id: u64) -> Tab {
        let tab_key = (TAB_PREFIX, tab_id);
        env.storage()
            .instance()
            .get(&tab_key)
            .expect("TabNotFound")
    }

    pub fn get_expense(env: Env, tab_id: u64, expense_id: u64) -> Expense {
        let expense_key = (EXPENSE_PREFIX, tab_id, expense_id);
        env.storage()
            .instance()
            .get(&expense_key)
            .expect("ExpenseNotFound")
    }

    pub fn get_tab_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&TAB_COUNT)
            .unwrap_or(0)
    }

    pub fn get_expense_count(env: Env, tab_id: u64) -> u64 {
        let expense_count_key = (TAB_PREFIX, tab_id, symbol_short!("CNT"));
        env.storage()
            .instance()
            .get(&expense_count_key)
            .unwrap_or(0)
    }

    pub fn get_members(env: Env, tab_id: u64) -> Vec<Address> {
        let tab_key = (TAB_PREFIX, tab_id);
        let tab: Tab = env
            .storage()
            .instance()
            .get(&tab_key)
            .expect("TabNotFound");
        tab.members
    }

    pub fn add_member(_env: Env, _caller: Address, _tab_id: u64, _new_member: Address) {
        panic!("not implemented");
    }

    pub fn remove_expense(_env: Env, _caller: Address, _tab_id: u64, _expense_id: u64) {
        panic!("not implemented");
    }

    pub fn settle(_env: Env, _caller: Address, _tab_id: u64, _to: Address) {
        panic!("not implemented");
    }

    pub fn reopen_tab(_env: Env, _caller: Address, _tab_id: u64) {
        panic!("not implemented");
    }
}