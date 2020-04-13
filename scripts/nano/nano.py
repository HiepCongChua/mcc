import nano


def check_balances(accounts):
    """Check balances"""

    for account in accounts:
        print('{}: {}'.format(account[:10], rpc.account_balance(account)))


# --------------------------------------------
# New wallet
# --------------------------------------------
rpc = nano.rpc.Client('http://localhost:7076')

w = rpc.wallet_create()

# 2018-08-13: cbex-daemon-dev
# w: 24ADD3F1FC01F61E90FC28C13F70F8ED516C1A2F111DC78ACD2A9687DB4D5511

w = '24ADD3F1FC01F61E90FC28C13F70F8ED516C1A2F111DC78ACD2A9687DB4D5511'
# --------------------------------------------
# New account
# --------------------------------------------

# Genesis account
test_private_key = '34F0A37AAD20F4A260F0A5B3CB3D7FB50673212263E58A380BC10474BB039CE4'
test_account = rpc.wallet_add(w, test_private_key)

# Check test account balance
rpc.account_balance(test_account)['balance'] / 1e30
print('{}: {}'.format(test_account[:10], rpc.account_balance(test_account)))

# --------------------------------------------
# Deposit
# --------------------------------------------
user_dev_18_addr = 'xrb_359mzb5xaz58gybj6gfm5151kddphtsh3udhbpsnz1d85oz8fng8e3yk6z4k'
user_dev_18_private_key = '847FFCEF09D45524BBDD14C81D6DB95200966D2218844663CBEDF0A07E3432C2'


user_dev_192_addr = 'xrb_34erj9icpf93ruhz4kqf74e1i9fhfr7ji69dzo5b6845zqwgy948fh5uy3dy'
user_dev_192_private_key = 'C4C262532566BC36620D246A329F62973BF70A0A9C446F05FB681EA959130523'


user_dev_172_addr = 'xrb_3e45z6egyt6wb5knde6rtjjigg7thg3tehf435uzfwago647xrrkrie338ag'
user_dev_172_private_key = '6D479F8CE9B556A712FFF2BB14F0B5054DD2CE6942AA1C74845F155A02166907'
user_dev_172_addr = rpc.wallet_add(w, user_dev_172_private_key)
block_hash = rpc.send(w, test_account, user_dev_172_addr, 1000 * 1e30)

user_dev_192_addr = rpc.wallet_add(w, user_dev_192_private_key)
rpc.account_balance(user_dev_192_addr)
user_dev_18_addr = rpc.wallet_add(w, user_dev_18_private_key)

# Step 1: Send coin to new account
block_hash = rpc.send(w, test_account, user_dev_192_addr, 1111)

# Step 2: Receive coin
rpc.receive(w, user_dev_172_addr, block_hash)

# Step 3: Check balance
# rpc.account_balance(user_dev_18_addr)
