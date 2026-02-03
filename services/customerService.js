const Customer = require("../models/customerModel");

const findOrCreateCustomerByPhone = async ({ phone, name }) => {
  if (!phone) return null;

  let customer = await Customer.findOne({ phone });

  if (customer) {
    // Optional: update name if provided & different
    if (name && name.trim() && customer.name !== name) {
      customer.name = name;
      await customer.save();
    }
    return customer;
  }

  // Create silently
  customer = await Customer.create({
    phone,
    name: name || ""
  });

  return customer;
};

module.exports = {
  findOrCreateCustomerByPhone
};
