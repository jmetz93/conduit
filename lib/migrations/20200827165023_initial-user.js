
exports.up = function(knex) {
  await knex.schema.createTable('Users', (t) => {

    t.increments('id').primary();
    t.string('email').notNullable().unique();
    t.binary('password');
  });
};

exports.down = function(knex) {
  await knex.schema.dropTable('Users');
};
