define('kbaseRunFba',
    [
        'jquery',
	'kbwidget',
	'kbasePanel'
    ],
    function ($) {


$.KBWidget({
    name: "kbaseRunFba",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var ws = options.ws;
        var id = options.id;
        var formulation = options.formulation;

        var container = $('<div id="kbase-run-fba">')

        var body = $('<div class="fba-run-info"><b>Model:</b> '+id+'<br><br></div>')
        var fba_button = $('<button type="button" class="btn btn-primary run-fba-btn" disabled="disabled">Run FBA</button>');
        body.append(fba_button)

        var panel = container.kbasePanel({title: 'Run FBA', body: body.html()});

        self.$elem.append(container);

        $('.run-fba-btn').click(function() {
            var fbaAJAX = kb.fba.queue_runfba({model: id, formulation: formulation, workspace: ws})
            self.$elem.append('<p class="muted loader-rxn"> \
                <img src="assets/img/ajax-loader.gif"> loading...</p>');
            $.when(fbaAJAX).done(function(data){
                console.log(data);
            })

        })

        return this;
    }  //end init
})
});
