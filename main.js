/** Пыталасть записать getPrice() и getKcal() через прототип
 * Dish.prototype.getPrice = function() {...}
 * но так не работало на отдельных блюдах, а через
 * Drink.prototype = Object.create(Dish.prototype);
 * Drink.prototype.getPrice = function() {...}
 * получается, каждому виду еды нужно прописывать функцию, а хотелось сделать универсальную, которая бы варьировалась
 * только в зависимости от того, по порциям считается или по веусу/объёму. Как это было лучше записать?
 *
 *
 *
 * Также, хотела убрать portion из блюд и сделать класс OrderItem, который знал бы о количестве блюда в заказе.
 * Должно ли это знать о себе каждое блюдо, или это должна знать orderItem?
 * Тогда был бы метод узнать цену блюда за базовую порцию (1шт или 100г) и у OrderItem - узнать стоимость за заказанное количество.
 * Мне показалось, добавлять прослойку OrderItem избыточным, но, может, следовало бы?
 */

const HAMBURGER_SIZES = {
  small: { name: 'маленький', price: 50, kcal: 20, },
  large: { name: 'большой', price: 100, kcal: 40, },
};

const STUFFINGS = {
  cheese: { name: 'сыр', price: 10, kcal: 20, },
  lattuce: { name: 'салат', price: 20, kcal: 5, },
  potato: { name: 'картофель', price: 15, kcal: 10, },
};

const SALADS = {
  ceasar: { name: 'Цезарь', price: 100, kcal: 20, },
  olivie: { name: 'Оливье', price: 50, kcal: 80, }, //aka russian salad
};

const DRINKS = {
  cola: { name: 'Кола', price: 50, kcal: 40, },
  coffee: { name: 'Кофе', price: 80, kcal: 20, },
};

const Dish = function (obj) {
  this.name = 'dish';
  this.price = obj.price;
  this.kcal = obj.kcal;
  this.hasStuffing = false;

  this.getPrice = function () {
    if (this.type == 'vol') {
      return this.price * this.portion.reduce((acc, portion) => acc + portion) / 100;
    } else if (this.type == 'items') {
      return (this.hasStuffing) ? ((this.price + this.stuffing.price) * this.portion) : (this.price * this.portion);
    }
  };

  this.getKcal = function () {
    if (this.type == 'vol') {
      return this.kcal * this.portion.reduce((acc, portion) => acc + portion) / 100;
    } else if (this.type == 'items') {
      return (this.hasStuffing) ? ((this.kcal + this.stuffing.kcal) * this.portion) : (this.kcal * this.portion);
    }
  };
};

const Drink = function (drink, portion = 100) {
  const obj = DRINKS[drink];
  Dish.call(this, obj, portion);
  this.name = drink;
  this.portion = [portion];
  this.type = 'vol';
};

const Salad = function (salad, portion = 100) {
  const obj = SALADS[salad];
  Dish.call(this, obj, portion);
  this.name = salad;
  this.portion = [portion];
  this.type = 'vol';
};

const Hamburger = function (size, stuffing, portion = 1) {
  Dish.call(this, HAMBURGER_SIZES[size], stuffing, portion);
  this.name = `hamburger ${size}`;
  this.stuffing = STUFFINGS[stuffing];
  this.portion = portion;
  this.type = 'items';
  this.hasStuffing = true;
};

const Order = function (paid = false) {
  this.paid = paid;
  this.items = [];
};

Order.prototype.isTheSameDish = function (item1, item2) {
  if (item1.name == item2.name) {
    const keys = Object.keys(item1);
    for (let key of keys) {
      if (key == 'portion' || (typeof key == 'object' && item1[key].name == item2[key].name)) {
        continue;
      } else if (item1[key] == item2[key]) {
        return true;
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
};

Order.prototype.addItem = function (newItem) {
  if (this.paid) {
    return false;
  }
  if (this.items.length > 0) {
    this.items.forEach(item => {
      if (this.isTheSameDish(item, newItem)) {
        const newPortion = newItem.portion;
        if (item.type == 'vol') {
          item.portion.push(...newPortion);
        } else if (item.type == 'items') {
          item.portion += newPortion;
        }
      } else {
        this.items.push(newItem);
      }
    });
  } else {
    this.items.push(newItem);
  }
};

Order.prototype.removeItem = function (itemToRemove) {
  let portionToRemove;

  this.items.forEach(item => {
    if (this.isTheSameDish(item, itemToRemove)) {
      if (item.portion == 1 || item.portion.length == 1) {
        const newItems = this.items.filter(el => !this.isTheSameDish(el, itemToRemove));
        this.items = [...newItems];
      } else {
        if (item.type == 'vol') {
          portionToRemove = itemToRemove.portion[0];

          for (let i = 0; i < item.portion.length; i++) {
            if (itemToRemove.portion[0] == item.portion[i]) {
              item.portion = [...item.portion.slice(0, i), ...item.portion.slice(i + 1)];
              break;
            }
          }
        } else if (item.type == 'items') {
          portionToRemove = itemToRemove.portion;

          item.portion -= portionToRemove;
        }
      }
    }
  });
};

Order.prototype.getTotalPrice = function () {
  const prices = [];
  this.items.map(el => {
    prices.push(el.getPrice());
  });
  return prices.reduce((acc, current) => acc + current);
};

Order.prototype.getTotalKcals = function () {
  const kcals = [];
  this.items.map(el => {
    kcals.push(el.getKcal());
  });
  return kcals.reduce((acc, current) => acc + current);
};

Order.prototype.makePaid = function () {
  if (this.paid == false) {
    this.paid = true;
    Object.freeze(this);
  } else {
    return;
  }
};
