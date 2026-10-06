"""Check a generated Python package by running it: what a type checker cannot see.

    python validate.py <package>        with the package's parent directory on PYTHONPATH

Imports every module of the package, then builds every generated structure with its defaults
and reads each of its fields, and checks that no field masks a member the class inherits. A
name of the model can shadow a name the generated code relies on, and Python says nothing until
the code runs -- `super()`, for one, is not something a type checker follows to the parameter
that hides it. Exit 1 with one line per problem.
"""
from __future__ import annotations

import importlib
import inspect
import pkgutil
import sys


def main(name: str) -> int:
    package = importlib.import_module(name)
    modules = [package] + [importlib.import_module(m.name)
                           for m in pkgutil.walk_packages(package.__path__, name + ".")]
    problems = []
    for module in modules:
        for cls in vars(module).values():
            if not inspect.isclass(cls) or cls.__module__ != module.__name__:
                continue
            for base in cls.__mro__[1:-1]:
                for member, value in vars(cls).items():
                    inherited = vars(base).get(member)
                    if (not member.startswith("_") and inherited is not None
                            and isinstance(value, property) and not isinstance(inherited, property)):
                        problems.append(f"{module.__name__}.{cls.__name__}.{member}: the field masks "
                                        f"{base.__name__}.{member}")
            if "ValueStructure" not in str(getattr(cls, "__orig_bases__", "")):
                continue
            try:
                instance = cls()
                for member, value in vars(cls).items():
                    if isinstance(value, property):
                        getattr(instance, member)
            except Exception as error:
                problems.append(f"{module.__name__}.{cls.__name__}(): {type(error).__name__}: {error}")
    for problem in problems:
        print(problem)
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1]))
