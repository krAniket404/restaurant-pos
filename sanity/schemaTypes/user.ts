import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'user',
  title: 'User Credentials',
  type: 'document',
  fields: [
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'Owner', value: 'owner' },
          { title: 'Cashier', value: 'cashier' },
          { title: 'Supervisor', value: 'supervisor' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'username',
      title: 'Username',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'password',
      title: 'Password',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],
});
