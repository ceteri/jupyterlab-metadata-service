import { JupyterFrontEnd } from '@jupyterlab/application';

import { IMetadataCommentsService } from '../metadata_iface/comments';

import { IMetadataApolloGraphQlConnection } from '../metadata_iface/apollo_connection';

import gql from 'graphql-tag';

class MetadataCommentsService implements IMetadataCommentsService {
  connection: IMetadataApolloGraphQlConnection;

  constructor(connection: IMetadataApolloGraphQlConnection) {
    this.connection = connection;
  }

  queryAllByTarget(target: String): Promise<{}> {
    return this.connection.query(
      gql`
        query($target: String!) {
          annotationsByTarget(target: $target) {
            id
            target
            context
            label
            total
            resolved
            body {
              value
              created
              creator {
                id
                name
                image
              }
            }
          }
        }
      `,
      { target: target }
    );
  }

  /**
   *
   * @param target
   * @param value
   * @param {object} creator An object with `id` key and string with creator ID
   * @param label
   */
  createThread(
    target: string,
    value: string,
    creator: object,
    label?: string
  ): void {
    this.connection.mutate(
      /* mutation statement */
      gql`
        mutation(
          $body: AnnotationTextualBodyInput
          $creator: PersonInput
          $label: String
          $target: String
        ) {
          addAnnotation(
            body: $body
            creator: $creator
            label: $label
            target: $target
          ) {
            success
            message
            result {
              id
              target
              context
              label
              total
              body {
                value
                created
                creator {
                  id
                  name
                  image
                }
              }
            }
          }
        }
      `,
      /* variables */
      {
        body: { value: value },
        creator: creator,
        label: label || null,
        target: target
      }
    );
  }

  createComment(threadId: String, value: String, creator: Object) {
    this.connection.mutate(
      /* mutation statement */
      gql`
        mutation(
          $annotation: AnnotationInput
          $body: AnnotationTextualBodyInput
        ) {
          addAnnotationItem(annotation: $annotation, body: $body) {
            success
            message
            result {
              value
              created
              creator {
                id
                name
                image
              }
            }
          }
        }
      `,
      /* variables */
      {
        body: { value: value, creator: creator },
        annotation: { id: threadId }
      }
    );
  }

  setResolvedValue(target: String, threadId: String, value: Boolean): void {
    this.connection.mutate(
      gql`
        mutation($annotation: AnnotationInput) {
          updateAnnotationResolve(annotation: $annotation) {
            success
            message
            result {
              resolved
            }
          }
        }
      `,
      {
        annotation: { target: target, id: threadId, resolved: value }
      }
    );
  }
}

export function activateMetadataComments(
  app: JupyterFrontEnd,
  connection: IMetadataApolloGraphQlConnection
): IMetadataCommentsService {
  return new MetadataCommentsService(connection);
}
