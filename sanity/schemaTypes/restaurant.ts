import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'restaurant',
  title: 'Restaurant Details',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Restaurant Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tables',
      title: 'Total Tables',
      description: 'Total number of tables available in the restaurant.',
      type: 'number',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
  ],
});

