import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'category',
  title: 'Menu Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g., Curries, Rotis, Starters',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
    }),
    defineField({
      name: 'parent',
      title: 'Parent Category (Optional)',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Select a parent category if this is a subcategory',
    }),
  ],
});
