module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            options: {
                separator: "\n\n",
                stripBanners: true,
                banner: "// <%= pkg.name %> <%= pkg.version %> | (c) <%= grunt.template.today('yyyy') %> Ryan Niemeyer |  http://www.opensource.org/licenses/mit-license\n"
            },
            dist: {
                src: "src/*.js",
                dest: "build/<%= pkg.name %>.js"
            }
        },
        uglify: {
            options: {
                stripBanners: true,
                banner: "// <%= pkg.name %> <%= pkg.version %> | (c) <%= grunt.template.today('yyyy') %> Ryan Niemeyer |  http://www.opensource.org/licenses/mit-license\n"
            },
            build: {
                src: "build/<%= pkg.name %>.js",
                dest: "build/<%= pkg.name %>.min.js"
            }
        },
        jshint: {
            files: "src/<%= pkg.name %>.js",
            options: {
                force: true
            }
        },
        jasmine : {
            src : "src/*.js",
            options : {
                specs : "spec/*.js",
                vendor: [
                    "bower_components/jquery/jquery.min.js",
                    "bower_components/jqueryui/ui/jquery-ui.js",
                    "bower_components/knockout.js/knockout.js"
                ],
                template : require("grunt-template-jasmine-istanbul"),
                templateOptions: {
                    coverage: "reports/coverage.json",
                    report: "reports/coverage"
                }
            }
        },
        watch: {
            scripts: {
                files: ["src/*.*"],
                tasks: ["default"]
            },
            tests: {
                files: ["spec/**/*.js"],
                tasks: ["jasmine"]
            }
        },
        bower: {
            install: {
                options: {
                    copy: false
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.loadNpmTasks("grunt-bower-task");

    // Default task(s).
    grunt.registerTask("default", ["bower", "jshint", "jasmine", "concat", "uglify"]);
};