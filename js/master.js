"use strict";

class Account {
  constructor({ owner, movements, interestRate, pin, movementsDates, currency, locale }) {
    this.owner = owner;
    this.movements = movements;
    this.interestRate = interestRate;
    this.pin = pin;
    this.movementsDates = movementsDates;
    this.currency = currency;
    this.locale = locale;
    this.username = this._createUsername();
  }

  _createUsername() {
    return this.owner
      .toLowerCase()
      .split(" ")
      .map(name => name[0])
      .join("");
  }
}

const accounts = [
  new Account({
    owner: "Jonas Schmedtmann",
    movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
    interestRate: 1.2,
    pin: 1111,
    movementsDates: [
      "2019-11-18T21:31:17.178Z",
      "2019-12-23T07:42:02.383Z",
      "2020-01-28T09:15:04.904Z",
      "2020-04-01T10:17:24.185Z",
      "2020-05-08T14:11:59.604Z",
      "2020-07-26T17:01:17.194Z",
      "2020-07-28T23:36:17.929Z",
      "2020-08-01T10:51:36.790Z",
    ],
    currency: "EUR",
    locale: "pt-PT",
  }),
  new Account({
    owner: "Jessica Davis",
    movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
    interestRate: 1.5,
    pin: 2222,
    movementsDates: [
      "2019-11-01T13:15:33.035Z",
      "2019-11-30T09:48:16.867Z",
      "2019-12-25T06:04:23.907Z",
      "2020-01-25T14:18:46.235Z",
      "2020-02-05T16:33:06.386Z",
      "2020-04-10T14:43:26.374Z",
      "2020-06-25T18:49:59.371Z",
      "2020-07-26T12:01:20.894Z",
    ],
    currency: "USD",
    locale: "en-US",
  }),
];

// DOM Elements (cached for performance)
const DOM = {
  welcome: document.querySelector(".welcome"),
  date: document.querySelector(".date"),
  balance: document.querySelector(".balance__value"),
  sumIn: document.querySelector(".summary__value--in"),
  sumOut: document.querySelector(".summary__value--out"),
  sumInterest: document.querySelector(".summary__value--interest"),
  timer: document.querySelector(".timer"),
  app: document.querySelector(".app"),
  movements: document.querySelector(".movements"),
  btnLogin: document.querySelector(".login__btn"),
  btnTransfer: document.querySelector(".form__btn--transfer"),
  btnLoan: document.querySelector(".form__btn--loan"),
  btnClose: document.querySelector(".form__btn--close"),
  btnSort: document.querySelector(".btn--sort"),
  inputLoginUsername: document.querySelector(".login__input--user"),
  inputLoginPin: document.querySelector(".login__input--pin"),
  inputTransferTo: document.querySelector(".form__input--to"),
  inputTransferAmount: document.querySelector(".form__input--amount"),
  inputLoanAmount: document.querySelector(".form__input--loan-amount"),
  inputCloseUsername: document.querySelector(".form__input--user"),
  inputClosePin: document.querySelector(".form__input--pin"),
};

// Utility Functions
const formatDate = (date, locale) => {
  const daysPassed = Math.round(Math.abs(Date.now() - date) / 86400000); // 1000 * 60 * 60 * 24
  return daysPassed === 0 ? "Today" :
         daysPassed === 1 ? "Yesterday" :
         daysPassed <= 7 ? `${daysPassed} days ago` :
         new Intl.DateTimeFormat(locale).format(date);
};

const formatCurrency = (value, locale, currency) =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

// Cached formatters for better performance
const formatters = new WeakMap();

// Core Functions
const displayMovements = (acc, sort = false) => {
  const movements = sort ? [...acc.movements].sort((a, b) => a - b) : acc.movements;
  
  DOM.movements.innerHTML = movements.map((mov, i) => {
    const type = mov > 0 ? "deposit" : "withdrawal";
    const date = new Date(acc.movementsDates[i]);
    const formatter = formatters.get(acc) || 
      new Intl.NumberFormat(acc.locale, { style: "currency", currency: acc.currency });
    formatters.set(acc, formatter);
    
    return `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
        <div class="movements__date">${formatDate(date, acc.locale)}</div>
        <div class="movements__value">${formatter.format(mov)}</div>
      </div>
    `;
  }).join("");
};

const calcDisplayBalance = (acc) => {
  acc.balance = acc.movements.reduce((sum, mov) => sum + mov, 0);
  DOM.balance.textContent = formatCurrency(acc.balance, acc.locale, acc.currency);
};

const calcDisplaySummary = (acc) => {
  const { movements, interestRate, locale, currency } = acc;
  const incomes = movements.reduce((sum, mov) => sum + (mov > 0 ? mov : 0), 0);
  const out = Math.abs(movements.reduce((sum, mov) => sum + (mov < 0 ? mov : 0), 0));
  const interest = movements
    .reduce((sum, mov) => mov > 0 ? sum + (mov * interestRate / 100) : sum, 0);

  DOM.sumIn.textContent = formatCurrency(incomes, locale, currency);
  DOM.sumOut.textContent = formatCurrency(out, locale, currency);
  DOM.sumInterest.textContent = formatCurrency(interest, locale, currency);
};

const updateUI = (acc) => {
  displayMovements(acc);
  calcDisplayBalance(acc);
  calcDisplaySummary(acc);
};

const startLogoutTimer = () => {
  let time = 500;
  const timer = setInterval(() => {
    const min = String(Math.trunc(time / 60)).padStart(2, "0");
    const sec = String(time % 60).padStart(2, "0");
    DOM.timer.textContent = `${min}:${sec}`;
    
    if (--time < 0) {
      clearInterval(timer);
      DOM.welcome.textContent = "Log in to get started";
      DOM.app.style.opacity = "0";
    }
  }, 1000);
  return timer;
};

// Event Handlers
let currentAccount, timer;

DOM.btnLogin.addEventListener("click", (e) => {
  e.preventDefault();
  currentAccount = accounts.find(acc => acc.username === DOM.inputLoginUsername.value);
  
  if (currentAccount?.pin === Number(DOM.inputLoginPin.value)) {
    DOM.welcome.textContent = `Welcome back, ${currentAccount.owner.split(" ")[0]}`;
    DOM.app.style.opacity = "100";
    DOM.date.textContent = new Intl.DateTimeFormat(currentAccount.locale, {
      hour: "numeric",
      minute: "numeric",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
    
    DOM.inputLoginUsername.value = DOM.inputLoginPin.value = "";
    DOM.inputLoginPin.blur();
    if (timer) clearInterval(timer);
    timer = startLogoutTimer();
    updateUI(currentAccount);
  }
});

DOM.btnTransfer.addEventListener("click", (e) => {
  e.preventDefault();
  const amount = Number(DOM.inputTransferAmount.value);
  const receiverAcc = accounts.find(acc => acc.username === DOM.inputTransferTo.value);
  
  if (
    amount > 0 &&
    receiverAcc &&
    currentAccount.balance >= amount &&
    receiverAcc.username !== currentAccount.username
  ) {
    currentAccount.movements.push(-amount);
    receiverAcc.movements.push(amount);
    currentAccount.movementsDates.push(new Date().toISOString());
    receiverAcc.movementsDates.push(new Date().toISOString());
    
    updateUI(currentAccount);
    if (timer) clearInterval(timer);
    timer = startLogoutTimer();
  }
  DOM.inputTransferAmount.value = DOM.inputTransferTo.value = "";
});

DOM.btnLoan.addEventListener("click", (e) => {
  e.preventDefault();
  const amount = Math.floor(DOM.inputLoanAmount.value);
  
  if (amount > 0 && currentAccount.movements.some(mov => mov >= amount * 0.1)) {
    setTimeout(() => {
      currentAccount.movements.push(amount);
      currentAccount.movementsDates.push(new Date().toISOString());
      updateUI(currentAccount);
      if (timer) clearInterval(timer);
      timer = startLogoutTimer();
    }, 2000);
  }
  DOM.inputLoanAmount.value = "";
});

DOM.btnClose.addEventListener("click", (e) => {
  e.preventDefault();
  if (
    DOM.inputCloseUsername.value === currentAccount.username &&
    Number(DOM.inputClosePin.value) === currentAccount.pin
  ) {
    accounts.splice(accounts.indexOf(currentAccount), 1);
    DOM.app.style.opacity = "0";
  }
  DOM.inputCloseUsername.value = DOM.inputClosePin.value = "";
});

let sorted = false;
DOM.btnSort.addEventListener("click", (e) => {
  e.preventDefault();
  displayMovements(currentAccount, sorted = !sorted);
});
