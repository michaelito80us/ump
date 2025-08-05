import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLError } from 'graphql';

export const scalarResolvers = {
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'Date custom scalar type',
    serialize(value: any) {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'string') {
        return new Date(value).toISOString();
      }
      throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
    },
    parseValue(value: any) {
      if (typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
        }
        return date;
      }
      throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        const date = new Date(ast.value);
        if (isNaN(date.getTime())) {
          throw new GraphQLError(`Value is not a valid DateTime: ${ast.value}`);
        }
        return date;
      }
      throw new GraphQLError(
        `Can only parse strings to dates but got a: ${ast.kind}`
      );
    },
  }),

  JSON: new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON custom scalar type',
    serialize(value: any) {
      return value;
    },
    parseValue(value: any) {
      return value;
    },
    parseLiteral(ast) {
      const parseLiteral = (node: any): any => {
        switch (node.kind) {
          case Kind.STRING:
          case Kind.BOOLEAN:
            return node.value;
          case Kind.INT:
          case Kind.FLOAT:
            return parseFloat(node.value);
          case Kind.OBJECT: {
            const value = Object.create(null);
            node.fields.forEach((field: any) => {
              value[field.name.value] = parseLiteral(field.value);
            });
            return value;
          }
          case Kind.LIST:
            return node.values.map((n: any) => parseLiteral(n));
          default:
            return null;
        }
      };
      return parseLiteral(ast);
    },
  }),
};
