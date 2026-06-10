import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'table',
  title: 'Restaurant Tables',
  type: 'document',
  fields: [
    defineField({
      name: 'tableNumber',
      title: 'Table Number',
      type: 'number',
      validation: (Rule) => Rule.required().integer().positive(),
    })
  ],
});
