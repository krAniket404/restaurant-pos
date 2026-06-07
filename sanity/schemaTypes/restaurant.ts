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
  ],
});
