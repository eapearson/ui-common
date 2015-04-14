/*jslint browser: true,  todo: true, vars: true, nomen: true */
/**
 * A collection of useful methods to make working with the KBase client apis
 * just a little bit easier.
 * 
 * @module APIUtils
 * @author Erik Pearson <eapearson@lbl.gov>
 * @version 0.0.3
 * 
 */
define(['kb.utils'],
    function (Utils) {
        "use strict";
        return Object.create({}, {
            // KBase Service Utility Methods
            // NB: these should really be contained in the service apis, but those are automatically generated.
            // Maybe a kbase services utility module?
            
            /**
             * @typedef {integer} ws_id
             */
            
            /**
             * @typedef {string} ws_name
             */
            
            /**
             * @typedef {string} username
             */
            
            /**
             * A time in the format YYYY-MM-DDThh:mm:ssZ, where Z is either the
             *	character Z (representing the UTC timezone) or the difference
             *	in time to UTC in the format +/-HHMM, eg:
             *		2012-12-17T23:24:06-0500 (EST time)
             *	2013-04-03T08:56:32Z (UTC time)
             * @typedef {string} timestamp
             */
            
            /**
             * A type string.
	*	Specifies the type and its version in a single string in the format
	*	[module].[typename]-[major].[minor]:
	*	
	*	module - a string. The module name of the typespec containing the type.
	*	typename - a string. The name of the type as assigned by the typedef
	*		statement.
	*	major - an integer. The major version of the type. A change in the
	*		major version implies the type has changed in a non-backwards
	*		compatible way.
	*	minor - an integer. The minor version of the type. A change in the
	*		minor version implies that the type has changed in a way that is
	*		backwards compatible with previous type definitions.
	*	
	*	In many cases, the major and minor versions are optional, and if not
	*	provided the most recent version will be used.
	*	
	*	Example: MyModule.MyType-3.1
        *	
        *	@typedef {string} type_string
             */
            
            /**
             * Represents the permissions a user or users have to a workspace:
	*
	*	'a' - administrator. All operations allowed.
	*	'w' - read/write.
	*	'r' - read.
	*	'n' - no permissions.
             * 
             * @typedef {string} permission
             */
            
            
            /**
             * 
             * The lock status of a workspace.
	* One of 'unlocked', 'locked', or 'published'.
             * 
             * @typedef {string} lock_status
             */
            
            /**
             * @typedef {object} usermeta
             */
            
            /**
             * Given a Workspace info array, defined workspace_info in the 
             * workspace spec, convert into an object in which each of the 
             * array elements is now stored in a property with the same name as
             * defined in the workspace spec.
             * 
             *  This makes dealing with workspace info much easier to reason 
             *  about and debug.
             *  
             *   Additional elements are added after the specified elements.
             *   
             *    @typedef {object} workspace_info
             *    @property {ws_id} id - the numerical ID of the workspace.
             *    @property {ws_name} name - name of the workspace.
             *    @property {username} owner - name of the user who owns (e.g. created) this workspace.
             *    @property {timestamp} moddate - date when the workspace was last modified.
             *    @property {int} objects - the approximate number of objects currently stored in the workspace.
             *    @property {permission} user_permission - permissions for the authenticated user of this workspace.
             *    @property {permission} globalread - whether this workspace is globally readable.
             *    @property {lock_status} lockstat - the status of the workspace lock.
             *    @property {usermeta} metadata - arbitrary user-supplied metadata about the workspace.
             */
            workspace_info_to_object: {
                value: function (wsInfo) {
                    return {
                        id: wsInfo[0],
                        name: wsInfo[1],
                        owner: wsInfo[2],
                        moddate: wsInfo[3],
                        object_count: wsInfo[4],
                        user_permission: wsInfo[5],
                        globalread: wsInfo[6],
                        lockstat: wsInfo[7],
                        metadata: wsInfo[8],
                        // Extra
                        modDate: Utils.iso8601ToDate(wsInfo[3])
                    };
                }
            },
            /*UnspecifiedObject data;
             object_info info;
             list<ProvenanceAction> provenance;
             username creator;
             timestamp created;
             list<obj_ref> refs;
             obj_ref copied;
             boolean copy_source_inaccessible;
             mapping<id_type, list<extracted_id>> extracted_ids;
             string handle_error;
             string handle_stacktrace;
             */

            workspace_object_to_object: {
                value: function (data) {
                    data.info = this.object_info_to_object(data.info);
                    return data;
                }

            },
            object_info_to_object: {
                value: function (data) {
                    var type = data[2].split(/[-\.]/);

                    return {
                        id: data[0],
                        name: data[1],
                        type: data[2],
                        save_date: data[3],
                        version: data[4],
                        saved_by: data[5],
                        wsid: data[6],
                        ws: data[7],
                        checksum: data[8],
                        size: data[9],
                        metadata: data[10],
                        // Extra
                        ref: data[7] + '/' + data[1],
                        obj_id: 'ws.' + data[6] + '.obj.' + data[0],
                        typeName: type[1],
                        typeMajorVersion: type[2],
                        typeMinorVersion: type[3],
                        saveDate: Utils.iso8601ToDate(data[3])
                    };
                }
            },
            makeWorkspaceObjectId: {
                value: function (workspaceId, objectId) {
                    return 'ws.' + workspaceId + '.obj.' + objectId;
                }
            },
            makeWorkspaceObjectRef: {
                value: function (workspaceId, objectId, objectVersion) {
                    return workspaceId + '/' + objectId + (objectVersion ? ('/' + objectVersion) : "");
                }
            }
        });
    });