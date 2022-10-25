import { isFieldAssociation, ModelFieldType, ModelMeta } from '../types';

/**
 * Defines a relationship from a LOCAL model.field to a REMOTE model.field and helps
 * navigate the relationship, providing a simplified peek at the relationship details
 * pertinent to setting FK's and constructing join conditions.
 *
 * Because I mean, relationships are tough.
 *
 */
export class ModelRelationship<T> {
	private localModel: ModelMeta<T>;
	private field: string;

	/**
	 * @param modelDefinition The "local" model.
	 * @param field The "local" model field.
	 */
	constructor(model: ModelMeta<T>, field: string) {
		if (!isFieldAssociation(model.schema, field)) {
			throw new Error(`${model.schema.name}.${field} is not a relationship.`);
		}
		this.localModel = model;
		this.field = field;
	}

	static from<T>(model: ModelMeta<T>, field: string) {
		try {
			return new this(model, field);
		} catch {
			return null;
		}
	}

	private get localDefinition() {
		return this.localModel.schema;
	}

	/**
	 * The constructor that can be used to query DataStore or create instance for
	 * the local model.
	 */
	get localConstructor() {
		return this.localModel.builder;
	}

	/**
	 * The name/type of the relationship the local model has with the remote model
	 * via the defined local model field.
	 */
	get type() {
		return this.localAssocation.connectionType;
	}

	/**
	 * Raw details about the local FK as-is from the local model's field definition in
	 * the schema. This field requires interpretation.
	 *
	 * @see localJoinFields
	 * @see localAssociatedWith
	 */
	private get localAssocation() {
		return this.localDefinition.fields[this.field].association!;
	}

	/**
	 * The fields on the local model that can be used to query or queried to match
	 * with instances of the remote model.
	 *
	 * Fields are returned in-order to match the order of `this.remoteKeyFields`.
	 */
	get localJoinFields() {
		/**
		 * This is relatively straightforward, actually.
		 *
		 * If we have explicitly stated targetNames, codegen is telling us authoritatively
		 * to use those fields for this relationship. The local model "points to" fields
		 * in the remote one.
		 *
		 * In other cases, the remote model points to this one's
		 */
		if (this.localAssocation.targetName) {
			// This case is theoretically unnecessary going forward.
			return [this.localAssocation.targetName];
		} else if (this.localAssocation.targetNames) {
			return this.localAssocation.targetNames;
		} else {
			return this.localPKFields;
		}
	}

	/**
	 * The fields on the local model that uniquely identify it.
	 *
	 * These fields may or may not be relevant to the join fields.
	 */
	get localPKFields() {
		return this.localModel.pkField;
	}

	private get remoteDefinition() {
		return this.remoteModelType.modelConstructor?.schema;
	}

	private get remoteModelType() {
		return this.localDefinition.fields[this.field].type as ModelFieldType;
	}

	/**
	 * Constructor that can be used to query DataStore or create instances for
	 * the remote model.
	 */
	get remoteModelConstructor() {
		return this.remoteModelType.modelConstructor!.builder!;
	}

	/**
	 * The fields on the remote model that uniquely identify it.
	 *
	 * These fields may or may not be relevant to the join fields.
	 */
	get remotePKFields() {
		return this.remoteModelType.modelConstructor?.pkField || ['id'];
	}

	/**
	 * The `associatedWith` fields from the local perspective.
	 *
	 * When present, these fields indicate which fields on the remote model to use
	 * when looking for a remote association and/or determining the final remote
	 * key fields.
	 */
	private get localAssociatedWith() {
		if (
			this.localAssocation.connectionType === 'HAS_MANY' ||
			this.localAssocation.connectionType === 'HAS_ONE'
		) {
			// This de-arraying is theoretically unnecessary going forward.
			return Array.isArray(this.localAssocation.associatedWith)
				? this.localAssocation.associatedWith
				: [this.localAssocation.associatedWith];
		} else {
			return undefined;
		}
	}

	private get explicitRemoteAssociation() {
		if (this.localAssociatedWith) {
			if (this.localAssociatedWith.length === 1) {
				return this.remoteDefinition!.fields[this.localAssociatedWith[0]]
					?.association;
			} else {
				return undefined;
			}
		}
	}

	/**
	 * The fields on the remote moel that can used to query or queried to match
	 * with instances of the local model.
	 *
	 * Fields are returned in-order to match the order of `this.localKeyFields`.
	 */
	get remoteJoinFields() {
		/**
		 * If the local relationship explicitly names "associated with" fields, we
		 * need to see if this points direction to a reciprocating assocation. If it
		 * does, the remote assocation indicates what fields to use.
		 */

		if (this.explicitRemoteAssociation?.targetName) {
			// This case is theoretically unnecessary going forward.
			return [this.explicitRemoteAssociation.targetName!];
		} else if (this.explicitRemoteAssociation?.targetNames) {
			return this.explicitRemoteAssociation?.targetNames!;
		} else if (this.localAssociatedWith) {
			return this.localAssociatedWith;
		} else {
			return this.remotePKFields;
		}
	}

	/**
	 * Whether this relationship everything necessary to get, set, and query from
	 * the perspective of the local model provided at instantiation.
	 */
	get isComplete() {
		return this.localJoinFields.length > 0 && this.remoteJoinFields.length > 0;
	}
}
