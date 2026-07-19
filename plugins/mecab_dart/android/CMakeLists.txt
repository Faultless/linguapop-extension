cmake_minimum_required(VERSION 3.4.1)

# MeCab is older C++ code that uses the now-removed `register` storage class
# and pre-C++14 idioms. Pin to C++14 and silence the deprecated-register
# warning so it builds against modern Android NDK toolchains.
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
add_compile_options(-Wno-register -Wno-deprecated-register)

add_library( mecab_dart

    # Sets the library as a shared library.
    SHARED

    # Provides a relative path to your source file(s).
    ../ios/Classes/char_property.cpp
    ../ios/Classes/eval.cpp
    ../ios/Classes/nbest_generator.cpp
    ../ios/Classes/tokenizer.cpp
    ../ios/Classes/connector.cpp
    ../ios/Classes/iconv_utils.cpp
    ../ios/Classes/param.cpp
    ../ios/Classes/utils.cpp
    ../ios/Classes/context_id.cpp
    ../ios/Classes/libmecab.cpp
    ../ios/Classes/string_buffer.cpp
    ../ios/Classes/viterbi.cpp
    ../ios/Classes/dictionary.cpp
    ../ios/Classes/dart_ffi.cpp
    ../ios/Classes/tagger.cpp
    ../ios/Classes/writer.cpp
)
