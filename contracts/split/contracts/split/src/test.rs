#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, vec, testutils::Address, Env, String};

#[test]
fn test_create_tab() {
    let env = Env::default();
    env.mock_all_auths();

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, SplitContract);

    let client = SplitContractClient::new(&env, &contract_id);

    let members = vec![&env, user2.clone()];
    let tab_id = client.create_tab(&user1, &String::from_str(&env, "Dinner"), &members);

    assert_eq!(tab_id, 1);

    let tab = client.get_tab(&tab_id);
    assert_eq!(tab.members.len(), 2);
    if let TabStatus::Open = tab.status {
        assert!(true);
    } else {
        panic!("Expected Open status");
    }
}

#[test]
fn test_add_expense() {
    let env = Env::default();
    env.mock_all_auths();

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, SplitContract);

    let client = SplitContractClient::new(&env, &contract_id);

    let members = vec![&env, user2.clone()];
    let tab_id = client.create_tab(&user1, &String::from_str(&env, "Trip"), &members);

    let split_between = vec![&env, user1.clone(), user2.clone()];
    let expense_id = client.add_expense(
        &user1,
        &tab_id,
        &String::from_str(&env, "Dinner"),
        &10000000i128,
        &user1,
        &split_between,
    );

    assert_eq!(expense_id, 1);

    let expense = client.get_expense(&tab_id, &expense_id);
    assert_eq!(expense.amount, 10000000i128);
}

#[test]
fn test_close_tab() {
    let env = Env::default();
    env.mock_all_auths();

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, SplitContract);

    let client = SplitContractClient::new(&env, &contract_id);

    let members = vec![&env, user2.clone()];
    let tab_id = client.create_tab(&user1, &String::from_str(&env, "Test"), &members);

    client.close_tab(&user1, &tab_id);

    let tab = client.get_tab(&tab_id);
    if let TabStatus::Closed = tab.status {
        assert!(true);
    } else {
        panic!("Expected Closed status");
    }
}

#[test]
#[should_panic(expected = "TabClosed")]
fn test_add_expense_to_closed_tab() {
    let env = Env::default();
    env.mock_all_auths();

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, SplitContract);

    let client = SplitContractClient::new(&env, &contract_id);

    let members = vec![&env, user2.clone()];
    let tab_id = client.create_tab(&user1, &String::from_str(&env, "Test"), &members);

    client.close_tab(&user1, &tab_id);

    let split_between = vec![&env, user1.clone(), user2.clone()];
    client.add_expense(
        &user1,
        &tab_id,
        &String::from_str(&env, "Dinner"),
        &10000000i128,
        &user1,
        &split_between,
    );
}

#[test]
#[should_panic(expected = "NotAMember")]
fn test_add_expense_by_non_member() {
    let env = Env::default();
    env.mock_all_auths();

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let non_member = Address::generate(&env);

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, SplitContract);

    let client = SplitContractClient::new(&env, &contract_id);

    let members = vec![&env, user2.clone()];
    let tab_id = client.create_tab(&user1, &String::from_str(&env, "Test"), &members);

    let split_between = vec![&env, user1.clone(), user2.clone()];
    client.add_expense(
        &non_member,
        &tab_id,
        &String::from_str(&env, "Dinner"),
        &10000000i128,
        &user1,
        &split_between,
    );
}

#[test]
fn test_get_tab_count() {
    let env = Env::default();
    env.mock_all_auths();

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, SplitContract);

    let client = SplitContractClient::new(&env, &contract_id);

    let members = vec![&env, user2.clone()];
    let _ = client.create_tab(&user1, &String::from_str(&env, "Tab1"), &members);
    let _ = client.create_tab(&user1, &String::from_str(&env, "Tab2"), &members);

    let count = client.get_tab_count();
    assert_eq!(count, 2);
}

#[test]
fn test_get_members() {
    let env = Env::default();
    env.mock_all_auths();

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, SplitContract);

    let client = SplitContractClient::new(&env, &contract_id);

    let members = vec![&env, user2.clone()];
    let tab_id = client.create_tab(&user1, &String::from_str(&env, "Test"), &members);

    let tab_members = client.get_members(&tab_id);
    assert_eq!(tab_members.len(), 2);
}