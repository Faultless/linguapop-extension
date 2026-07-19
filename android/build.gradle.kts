allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Compat shims for Flutter plugins that were built against older AGP / Kotlin.
//
// (1) Backfill `android.namespace` from the legacy `<manifest package="…">`
//     attribute for plugins predating AGP 8's namespace requirement
//     (e.g. mecab_dart 0.1.6).
// (2) Pin every Kotlin compile task to match its Java compile target so
//     Gradle's "Inconsistent JVM-target compatibility" check passes. Each
//     plugin can declare a different Java target (mecab_dart defaults to 1.8,
//     flutter_tts hardcodes 11, our app uses 17); we read whatever the
//     subproject resolved Java to and align Kotlin to the same number.
//     Read-only — we never write compileOptions, which AGP finalizes early.
subprojects {
    plugins.withId("com.android.library") {
        extensions.configure<com.android.build.gradle.LibraryExtension>("android") {
            if (namespace == null) {
                val manifest = file("src/main/AndroidManifest.xml")
                if (manifest.exists()) {
                    val pkgRegex = Regex("""package\s*=\s*"([^"]+)"""")
                    pkgRegex.find(manifest.readText())?.let { match ->
                        namespace = match.groupValues[1]
                    }
                }
            }
        }
        afterEvaluate {
            val androidExt =
                extensions.getByType<com.android.build.gradle.LibraryExtension>()
            val resolved = androidExt.compileOptions.targetCompatibility.majorVersion
            val jvmTargetEnum = when (resolved) {
                "1.8", "8" -> org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_1_8
                "11" -> org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_11
                "17" -> org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
                "21" -> org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21
                else -> org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_11
            }
            tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
                compilerOptions {
                    jvmTarget.set(jvmTargetEnum)
                }
            }
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
